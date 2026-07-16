const cds = require('@sap/cds')
const https = require('https')
const http = require('http')
const { OrchestrationClient } = require('@sap-ai-sdk/orchestration')
const { getAiCoreDestination } = require('@sap-ai-sdk/core')

const DEPLOYMENT_ID = 'd1290d7743ce67b6'
const RESOURCE_GROUP = 'predictive-returns'
const LLM_RESOURCE_GROUP = 'default'
const LLM_MODEL = 'anthropic--claude-4.5-sonnet'
const LOG = cds.log('predict-service')

const SYSTEM_PROMPT = `You are an analytics assistant embedded in a Predictive Return Risk tool for a fashion/retail e-commerce business. You receive an order's attributes and a model-predicted return risk score, and you explain the prediction to business users (merchandising, logistics, and ops teams).

Your explanation must:
- Be grounded strictly in the specific input values given — never invent data not provided.
- Explain the "why" behind the risk score by connecting it to real retail return-rate patterns (e.g. customer loyalty/purchase history, size extremes, discount depth, category-specific return tendencies, channel differences between online/marketplace/retail store).
- Distinguish which factors are increasing risk vs. reducing risk when both are present.
- Give the business team something actionable, not just a description.
- Stay concise per section — this is a UI card, not a report.

Always respond in the following markdown structure, with no preamble or extra text outside it:

## Summary
One sentence stating the risk level and the single biggest driver.

## Key Risk Drivers
2-3 bullet points, each naming a specific input factor and how it pushes risk up or down.

## Contributing Factors
1-2 bullet points on secondary/interacting factors (e.g. combination effects like "high discount + first-time buyer").

## Recommended Action
1-2 bullet points with a concrete, specific operational recommendation (e.g. proactive size-fit messaging, hold at DC for QC check, targeted post-purchase communication).

Keep the entire response under 180 words. Do not use hedging language like "might" or "could possibly" — state the model's reasoning with confidence, since this is a probability output already.`

function buildUserMessage(orderData, prediction) {
    const prob = Math.round(prediction.return_risk_prob * 100)
    const riskLevel = prediction.return_risk_flag === 1 ? 'HIGH' : 'LOW'

    return `Explain the return risk for this order. The model predicted ${riskLevel} risk with ${prob}% probability.

<order_data>
Customer Type: ${orderData.customer_type}
Material Group: ${orderData.material_group}
Price: ₹${orderData.price}
Size: ${orderData.size}
Discount: ${orderData.discount}%
Quantity: ${orderData.quantity}
Season: ${orderData.season}
Brand: ${orderData.brand}
Channel: ${orderData.channel}
Customer Purchase Count: ${orderData.customer_purchase_count}
Return Risk Probability: ${prob}%
Risk Level: ${riskLevel}
</order_data>`
}

// Cache destination for 5 minutes
let _destCache = null
let _destCachedAt = 0

async function getCachedDestination() {
    const now = Date.now()
    if (_destCache && now - _destCachedAt < 5 * 60 * 1000) return _destCache

    // Inject our binding credentials as AICORE_SERVICE_KEY so getAiCoreDestination() picks them up
    const credentials = getAiCoreCredentials()
    process.env.AICORE_SERVICE_KEY = JSON.stringify(credentials)

    _destCache = await getAiCoreDestination()
    _destCachedAt = now
    LOG.info('AI Core destination resolved')
    return _destCache
}

function getAiCoreCredentials() {
    const vcap = process.env.VCAP_SERVICES
    if (vcap) {
        const services = JSON.parse(vcap)
        const aicore = services['aicore'] || services['ml-foundation-services'] || []
        if (aicore.length > 0) return aicore[0].credentials
    }
    const env = cds.env.requires?.myaicore?.credentials
    if (env) return env
    throw new Error('No AI Core credentials found')
}

async function fetchToken(credentials) {
    const tokenUrl = new URL('/oauth/token', credentials.url || credentials.auth_url)
    const auth = Buffer.from(`${credentials.clientid}:${credentials.clientsecret}`).toString('base64')

    return new Promise((resolve, reject) => {
        const body = 'grant_type=client_credentials'
        const options = {
            hostname: tokenUrl.hostname,
            path: tokenUrl.pathname,
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(body),
            },
        }
        const req = https.request(options, (res) => {
            let data = ''
            res.on('data', chunk => data += chunk)
            res.on('end', () => {
                try { resolve(JSON.parse(data)) }
                catch (e) { reject(e) }
            })
        })
        req.on('error', reject)
        req.write(body)
        req.end()
    })
}

module.exports = class PredictService extends cds.ApplicationService {
    async init() {
        const app = await cds.app

        // Prediction endpoint — calls Random Forest model on AI Core
        app.use('/api/predict', require('express').json())
        app.post('/api/predict', async (req, res) => {
            try {
                const credentials = getAiCoreCredentials()
                LOG.info('Got credentials for clientid:', credentials.clientid)

                const tokenResponse = await fetchToken(credentials)
                const token = tokenResponse.access_token
                LOG.info('Token fetched OK')

                const apiUrl = credentials.serviceurls?.AI_API_URL || credentials.apiurl
                const url = new URL(`/v2/inference/deployments/${DEPLOYMENT_ID}/v1/predict`, apiUrl)
                LOG.info('Calling:', url.toString())

                const body = JSON.stringify(req.body)
                const isHttps = url.protocol === 'https:'
                const lib = isHttps ? https : http

                const result = await new Promise((resolve, reject) => {
                    const options = {
                        hostname: url.hostname,
                        path: url.pathname,
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'AI-Resource-Group': RESOURCE_GROUP,
                            'Content-Type': 'application/json',
                            'Content-Length': Buffer.byteLength(body),
                        },
                    }
                    const request = lib.request(options, (response) => {
                        let data = ''
                        response.on('data', chunk => data += chunk)
                        response.on('end', () => {
                            LOG.info('AI Core status:', response.statusCode)
                            if (response.statusCode >= 400) {
                                reject(new Error(`AI Core ${response.statusCode}: ${data}`))
                            } else {
                                try { resolve(JSON.parse(data)) }
                                catch (e) { reject(e) }
                            }
                        })
                    })
                    request.on('error', reject)
                    request.write(body)
                    request.end()
                })

                res.json(result)
            } catch (err) {
                LOG.error('Predict failed:', err.message)
                res.status(500).json({ error: 'Prediction failed: ' + err.message })
            }
        })

        // SSE streaming endpoint — calls LLM via AI Core orchestration
        app.use('/insights-stream', require('express').json())
        app.post('/insights-stream', async (req, res) => {
            const { orderData, prediction } = req.body || {}
            if (!orderData || !prediction) {
                res.status(400).json({ error: 'orderData and prediction are required' })
                return
            }

            res.setHeader('Content-Type', 'text/event-stream')
            res.setHeader('Cache-Control', 'no-cache')
            res.setHeader('Connection', 'keep-alive')
            res.setHeader('X-Accel-Buffering', 'no')
            res.flushHeaders()

            const controller = new AbortController()
            res.on('close', () => controller.abort())

            try {
                const destination = await getCachedDestination()
                const userMessage = buildUserMessage(orderData, prediction)

                const client = new OrchestrationClient(
                    {
                        promptTemplating: {
                            model: { name: LLM_MODEL },
                            prompt: {
                                template: [
                                    { role: 'system', content: SYSTEM_PROMPT },
                                    { role: 'user', content: [{ type: 'text', text: userMessage }] },
                                ],
                            },
                        },
                    },
                    { resourceGroup: LLM_RESOURCE_GROUP },
                    destination
                )

                LOG.info('Starting LLM stream for insights')
                const streamResponse = await client.stream(
                    {},
                    controller.signal,
                    undefined,
                    { headers: { 'Accept-Encoding': 'identity' } }
                )

                for await (const chunk of streamResponse.stream.toContentStream()) {
                    if (res.writableEnded) break
                    if (chunk == null) continue
                    res.write(`data: ${JSON.stringify(String(chunk))}\n\n`)
                    if (typeof res.flush === 'function') res.flush()
                }

                if (!res.writableEnded) {
                    res.write('data: [DONE]\n\n')
                    res.end()
                }
                LOG.info('LLM stream complete')
            } catch (err) {
                if (err?.name === 'AbortError' || err?.code === 'CanceledError') return
                const detail = err?.cause?.response?.data ?? err?.response?.data ?? err?.message ?? 'unknown'
                LOG.error('Insights stream failed:', typeof detail === 'object' ? JSON.stringify(detail) : detail)
                if (!res.writableEnded) {
                    res.write(`data: ${JSON.stringify({ error: typeof detail === 'object' ? JSON.stringify(detail) : detail })}\n\n`)
                    res.end()
                }
            }
        })

        app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))

        return super.init()
    }
}
