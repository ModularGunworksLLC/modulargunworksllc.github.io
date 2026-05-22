# Connect Cursor / Lightsail to Vercel (so the agent can deploy for you)

## What is already connected

| Link | Status |
|------|--------|
| **GitHub** → this repo | Working — agent pushes to `main`, Vercel auto-builds |
| **Vercel dashboard** → you | Needed for Root Directory, env vars, domains |
| **Agent → Vercel dashboard** | **Not** connected — agent cannot click your Vercel UI |

## Why you do not see the new storefront

Two separate issues:

1. **Build folder** — The Next.js app is in **`apps/store`**, but Vercel is probably still building from repo root **`./`**. That produces **404** on `/` (no real site at root).
2. **Dashboard error** — Your screenshot (“Something went wrong” on Overview) is a **Vercel website UI bug**, not proof the project is missing. Deployments can still work.

## See the site without the Overview page

Use these **direct links** (replace team slug if yours differs):

- **Deployments (bypass broken Overview):**  
  https://vercel.com/modulargunworksllcs-projects/modulargunworksllc-github-io/deployments
- **Project settings (Root Directory):**  
  https://vercel.com/modulargunworksllcs-projects/modulargunworksllc-github-io/settings
- **Production URL (after Root Directory fix):**  
  https://modulargunworksllc-github-io.vercel.app

On **Deployments**, open the top **Ready** row (`621be2e`), click **Visit**.

### One-time fix (you or agent with token)

**Settings → General → Root Directory** = **`apps/store`** → Save → **Redeploy**.

## Let the agent change Vercel for you (optional)

Create a **Vercel access token** (do not paste it in chat):

1. https://vercel.com/account/tokens → **Create Token** (name: `Cursor Lightsail`).
2. On the Lightsail server (or Cursor **Settings → Environment**), set:
   ```bash
   export VERCEL_TOKEN="your_token_here"
   ```
3. Tell the agent: **“VERCEL_TOKEN is set”**.

Then the agent can run `vercel` CLI to link the project, set root directory, and trigger deploys — without you using the broken Overview page.

## If the dashboard stays broken

- Hard refresh (Ctrl+Shift+R) or another browser / incognito.
- Check https://www.vercel-status.com/
- Use **Deployments** and **Settings** links above (sidebar), not **Overview**.
- Email Vercel support with the error from Overview if Deployments also fail.

## What the agent can do without a token

- Build and push code to GitHub (`apps/store`, APIs, etc.)
- Document exact Vercel settings
- **Cannot** change Root Directory or env vars in your Vercel account without a token or you clicking Save
