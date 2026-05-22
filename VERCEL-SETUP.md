# Vercel setup — Modular Gunworks store

Your Vercel project is linked to this repo. **Production WordPress on Lightsail is unchanged.**

**Dashboard shows “Something went wrong” on Overview?** Use direct links in [`VERCEL-CONNECT.md`](VERCEL-CONNECT.md) — open **Deployments** or **Settings**, not Overview.

## One-time dashboard change (required)

1. Open [Vercel](https://vercel.com) → project **modulargunworksllc-github-io** (or renamed **mgw-store**).
2. **Settings → Build and Deployment → Root Directory** → set to **`apps/store`** → Save.
3. **Framework Preset** → **Next.js** (if not auto-detected).
4. **Important:** Changing root does **not** update old deployments. You **must** redeploy after saving:
   - **Deployments** → latest → **⋯** → **Redeploy**, or push a new commit to `main`.

**How to tell the old build is still live:** `/` returns 404 and `/docs` still works — that means Vercel is still serving the repo root, not `apps/store`.

After redeploy, the home page should show the Modular Gunworks header/hero (not 404).

## Do not do yet

- Add **modulargunworks.com** as a custom domain (wait for QA).
- Stop WordPress or `ledger.service` on Lightsail.

## Preview URL

Use the `*.vercel.app` URL from the latest deployment. A gray banner notes that the live store is still on modulargunworks.com.

## Environment variables (later)

Add in Vercel → Settings → Environment Variables (see `apps/store/.env.example`).
