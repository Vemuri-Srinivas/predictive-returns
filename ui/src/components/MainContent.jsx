import { useEffect, useRef, useState } from 'react'
import styles from './MainContent.module.css'

function SparkleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#0070F2">
      <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z" />
      <path d="M19 14l.75 2.25L22 17l-2.25.75L19 20l-.75-2.25L16 17l2.25-.75L19 14z" opacity="0.65" />
      <path d="M5 17l.5 1.5L7 19l-1.5.5L5 21l-.5-1.5L3 19l1.5-.5L5 17z" opacity="0.45" />
    </svg>
  )
}

function LoadingDots() {
  return <span className={styles.loadingDots}><span>.</span><span>.</span><span>.</span></span>
}

function useInsightStream(result, formData) {
  const [text, setText] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState(null)
  const abortRef = useRef(null)

  useEffect(() => {
    if (!result) { setText(''); setError(null); return }

    // Abort any previous stream
    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setText('')
    setError(null)
    setIsStreaming(true)

    fetch('/insights-stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderData: formData, prediction: result }),
      signal: controller.signal,
    }).then(async (res) => {
      if (!res.ok) { setError('Failed to generate insights'); setIsStreaming(false); return }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop()
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') { setIsStreaming(false); return }
          try {
            const parsed = JSON.parse(data)
            if (parsed?.error) { setError(parsed.error); setIsStreaming(false); return }
            if (typeof parsed === 'string') setText(prev => prev + parsed)
          } catch { /* ignore parse errors */ }
        }
      }
      setIsStreaming(false)
    }).catch((err) => {
      if (err.name !== 'AbortError') { setError(err.message); setIsStreaming(false) }
    })

    return () => controller.abort()
  }, [result])

  return { text, isStreaming, error }
}

function renderInline(text) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  return parts.map((part, i) => i % 2 === 1 ? <strong key={i}>{part}</strong> : part)
}

function MarkdownContent({ text, isStreaming }) {
  // Parse markdown into blocks: ## heading, - bullet, plain paragraph
  const lines = text.split('\n')
  const blocks = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (line.startsWith('## ')) {
      blocks.push({ type: 'heading', text: line.slice(3) })
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      const items = []
      while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
        items.push(lines[i].slice(2))
        i++
      }
      blocks.push({ type: 'list', items })
      continue
    } else if (line.trim()) {
      blocks.push({ type: 'paragraph', text: line })
    }
    i++
  }

  const isLast = (idx) => idx === blocks.length - 1

  return (
    <div className={styles.markdownContent}>
      {blocks.map((block, idx) => {
        if (block.type === 'heading') return (
          <div key={idx} className={styles.mdHeading}>{block.text}</div>
        )
        if (block.type === 'list') return (
          <ul key={idx} className={styles.mdList}>
            {block.items.map((item, j) => {
              const isLastItem = isLast(idx) && j === block.items.length - 1
              return (
                <li key={j} className={styles.mdListItem}>
                  {renderInline(item)}{isStreaming && isLastItem && <span className={styles.cursor} />}
                </li>
              )
            })}
          </ul>
        )
        return (
          <p key={idx} className={styles.mdParagraph}>
            {renderInline(block.text)}
            {isStreaming && isLast(idx) && <span className={styles.cursor} />}
          </p>
        )
      })}
      {isStreaming && blocks.length === 0 && <span className={styles.cursor} />}
    </div>
  )
}

function RiskGauge({ probability }) {
  const pct = Math.round(probability * 100)
  const isHigh = pct >= 50
  const color = isHigh ? 'var(--color-red)' : 'var(--color-green)'

  return (
    <div className={styles.gaugeWrapper}>
      <div className={styles.gaugeLabel}>Return Risk Probability</div>
      <div className={styles.gaugeTrack}>
        <div className={styles.gaugeFill} style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className={styles.gaugePct} style={{ color }}>{pct}%</div>
    </div>
  )
}

function RiskBadge({ flag }) {
  return (
    <div className={flag === 1 ? styles.badgeHigh : styles.badgeLow}>
      {flag === 1 ? 'High Risk — Likely to be Returned' : 'Low Risk — Unlikely to be Returned'}
    </div>
  )
}

function AiInsights({ result, formData }) {
  const { text, isStreaming, error } = useInsightStream(result, formData)

  return (
    <div className={styles.insightCard}>
      <div className={styles.insightCardHeader}>
        <SparkleIcon />
        <span className={styles.insightTitle}>
          {isStreaming ? <>AI Insights<LoadingDots /></> : 'AI Insights'}
        </span>
      </div>
      <div className={styles.insightBody}>
        {error ? (
          <p className={styles.insightError}>{error}</p>
        ) : !text && isStreaming ? (
          <p className={styles.insightPlaceholder}>Generating insights<LoadingDots /></p>
        ) : (
          <MarkdownContent text={text} isStreaming={isStreaming} />
        )}
      </div>
    </div>
  )
}

function PageHeader() {
  return (
    <div className={styles.pageHeader}>
      <h1 className={styles.pageTitle}>Return Risk Prediction</h1>
    </div>
  )
}

export default function MainContent({ result, isLoading, error, formData }) {
  if (isLoading) {
    return (
      <main className={styles.main}>
        <PageHeader />
        <div className={styles.body}>
          <div className={styles.emptyCard}>
            <div className={styles.emptyIconWrapper}><SparkleIcon /></div>
            <p className={styles.emptyHeading}>Analyzing order<LoadingDots /></p>
            <p className={styles.emptyMessage}>Running the prediction model against your order details.</p>
          </div>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className={styles.main}>
        <PageHeader />
        <div className={styles.body}>
          <div className={styles.emptyCard}>
            <div className={styles.emptyIconWrapper}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <p className={styles.emptyHeading}>Prediction failed</p>
            <p className={styles.emptyMessage}>{error}</p>
          </div>
        </div>
      </main>
    )
  }

  if (!result) {
    return (
      <main className={styles.main}>
        <PageHeader />
        <div className={styles.body}>
          <div className={styles.emptyCard}>
            <div className={styles.emptyIconWrapper}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0070F2" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
            </div>
            <p className={styles.emptyHeading}>No prediction yet</p>
            <p className={styles.emptyMessage}>Fill in the order details on the left and click <em>Predict Return Risk</em> to get started.</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className={styles.main}>
      <PageHeader />
      <div className={styles.body}>
        <div className={styles.card}>
          <div className={styles.cardTitle}>Prediction Result</div>
          <RiskBadge flag={result.return_risk_flag} />
          <RiskGauge probability={result.return_risk_prob} />
        </div>
        <AiInsights result={result} formData={formData} />
      </div>
    </main>
  )
}
