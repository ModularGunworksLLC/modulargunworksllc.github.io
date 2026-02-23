# Deploy to Northflank Sandbox

## Prerequisites
- Northflank account (Sandbox tier)
- Docker Hub account (free) OR GitHub account

---

## Workaround: Deploy via Docker (bypasses Git branch issue)

If Northflank's branch picker shows "No options", use a pre-built Docker image instead:

### Step 1: Build and push to Docker Hub

1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) if needed
2. Sign up at [hub.docker.com](https://hub.docker.com) (free)
3. In terminal, from your project folder:

```bash
docker login
docker build -t YOUR_DOCKERHUB_USERNAME/modular-gunworks .
docker push YOUR_DOCKERHUB_USERNAME/modular-gunworks
```

Replace `YOUR_DOCKERHUB_USERNAME` with your Docker Hub username.

### Step 2: Create service on Northflank

1. **Add service** → Choose **Deployment** → **Deploy a Docker image**
2. **Image:** `YOUR_DOCKERHUB_USERNAME/modular-gunworks:latest`
3. **Service name:** `modular-gunworks`
4. **Add port:** 3000 (public)
5. **Environment variables:** Add `GUNTAB_API_TOKEN` and `GUNTAB_SELLER_EMAIL`
6. **Create service**

No Git or branch selection required.

---

## Step 1: Link GitHub to Northflank

1. Go to [app.northflank.com](https://app.northflank.com)
2. **Settings** (gear) → **Integrations** → **Git**
3. Connect your GitHub account and authorize Northflank

---

## Step 2: Create a Project

1. Click **Create project**
2. Name it (e.g. `modular-gunworks`)
3. Choose **Northflank Cloud** (Sandbox)

---

## Step 3: Add a Service

1. In your project, click **Add service**
2. Select **Build from Git**
3. Choose your GitHub repo
4. **Branch:** `main` (or your default branch)
5. **Build type:** Buildpacks (auto-detects Node.js)

---

## Step 4: Configure the Service

**Compute:** Use the smallest Sandbox plan (256MB should work)

**Build settings:**
- **Build command:** (leave default – runs `npm install`)
- **Start command:** `node serve.js` (or leave blank – `package.json` has `"start": "node serve.js"`)

**Environment variables** (critical – add under Secrets / Variables):

| Name | Value | Notes |
|------|-------|-------|
| `GUNTAB_API_TOKEN` | Your GunTab live API token | From .env |
| `GUNTAB_SELLER_EMAIL` | modulargunworks@gmail.com | Optional, this is default |
| `PUBLIC_STORE_URL` | https://modulargunworks.com | For redirects |
| `GUNTAB_LISTING_BASE` | Northflank URL (e.g. `https://http--modular-gunworks--xxxxx.code.run`) | **Required for GunTab.** Run `node scripts/audit-northflank.js --fix` to set. |
| `NODE_ENV` | production | Optional |

⚠️ **Do NOT add** `.env` to Git. Set these in Northflank’s UI.

---

## Step 5: Deploy

1. Click **Deploy** / **Create**
2. Northflank will build and deploy
3. Wait for the build to finish (logs will show progress)
4. Your app will get a URL like `https://your-service-xxxxx.code.run`

---

## Step 6: Use Your Backend

**Option A – Full site on Northflank**
- Your `serve.js` serves both the site and the API
- Point your domain (modulargunworks.com) to the Northflank URL
- In Northflank: **Settings** → **Domains** → add `modulargunworks.com`

**Option B – API only (site stays on GitHub Pages)**
- Keep the site on GitHub Pages
- Update the cart/product pages to call your Northflank API URL instead of `/api/...`
- e.g. change `fetch('/api/guntab-create-invoice', ...)` to `fetch('https://your-service-xxxxx.code.run/api/guntab-create-invoice', ...)`

---

## Step 7: GunTab Webhook (after deploy)

1. In GunTab: **Account** → **Webhooks**
2. Add endpoint: `https://your-northflank-url.code.run/api/guntab-webhook`
3. Copy the **signing secret key** (`ssk_...`)
4. Add to Northflank env vars: `GUNTAB_WEBHOOK_SECRET` = your key

---

## Troubleshooting

**Build fails:** Check build logs. Ensure `package.json` has `"start": "node serve.js"`.

**503 / app won’t start:** Verify env vars are set. Check runtime logs.

**GunTab "Url does not exist or requires login":** Set `GUNTAB_LISTING_BASE` to your Northflank URL. Run `node scripts/audit-northflank.js --fix`.

**Orders not persisting:** `data/orders.json` is on ephemeral disk. For persistence, add a Northflank Volume or switch to Neon (DATABASE_URL).

---

## Quick reference

- **Northflank app:** https://app.northflank.com  
- **Docs:** https://northflank.com/docs  
