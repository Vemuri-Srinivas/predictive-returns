# AI Core Deployment Guide

## Prerequisites
- Docker installed
- Docker Hub account (or any container registry)
- Access to SAP AI Launchpad (myaicore workspace, default resource group)

---

## Step 1 — Install Docker
Download from: https://www.docker.com/products/docker-desktop

---

## Step 2 — Build and Push Docker Image

```bash
cd /Users/i577113/projects/predictive-returns

# Build the image
docker build -t YOUR_DOCKER_USERNAME/predictive-returns:latest .

# Test it locally first
docker run -p 9001:9001 YOUR_DOCKER_USERNAME/predictive-returns:latest

# Test the endpoint
curl -X POST http://localhost:9001/api/predict \
  -H "Content-Type: application/json" \
  -d '{"customer_type":"new","material_group":"shoes","price":1999,"size":"XL","discount":45.0,"quantity":1,"season":"Spring","brand":"BrandA","channel":"Marketplace","customer_purchase_count":0}'

# Push to Docker Hub
docker login
docker push YOUR_DOCKER_USERNAME/predictive-returns:latest
```

---

## Step 3 — Register Docker Registry in AI Launchpad

1. Open SAP AI Launchpad → **myaicore** workspace
2. Go to **ML Operations → Docker Registry Secrets**
3. Click **Add** → enter your Docker Hub credentials
4. Note the secret name (use it in serving_template.yaml as `YOUR_DOCKER_REGISTRY_SECRET`)

---

## Step 4 — Connect GitHub to AI Core (for serving template)

1. Go to **ML Operations → Git Repositories**
2. Add your GitHub repo containing `aicore/serving_template.yaml`
3. AI Core syncs the serving template automatically

OR upload the serving template directly via AI Core API.

---

## Step 5 — Update serving_template.yaml

Replace placeholders in `aicore/serving_template.yaml`:
- `YOUR_DOCKER_REGISTRY_SECRET` → secret name from Step 3
- `YOUR_DOCKER_USERNAME` → your Docker Hub username

---

## Step 6 — Create Deployment in AI Launchpad

1. Go to **ML Operations → Configurations**
2. Create new configuration:
   - Scenario: `predictive-returns`
   - Executable: `predictive-returns-server`
   - Resource Plan: `starter`
3. Go to **ML Operations → Deployments**
4. Click **Create** → select your configuration
5. Wait for status: `RUNNING` (takes 2-5 minutes)
6. Copy the **Deployment URL**

---

## Step 7 — Update React UI to use AI Core endpoint

In `ui/vite.config.js`, replace the proxy target:

```js
proxy: {
  '/api': {
    target: 'https://YOUR_AICORE_DEPLOYMENT_URL',
    changeOrigin: true,
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN',
      'AI-Resource-Group': 'default'
    }
  }
}
```

---

## Resource Group & Workspace
- Workspace: `myaicore`
- Resource Group: `default`
