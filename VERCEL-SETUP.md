# Vercel setup — Modular Gunworks store

Your Vercel project is linked to this repo. **Production WordPress on Lightsail is unchanged.**

## One-time dashboard change (required)

1. Open [Vercel](https://vercel.com) → project **modulargunworksllc-github-io** (or renamed **mgw-store**).
2. **Settings → General → Root Directory** → set to **`apps/store`** → Save.
3. **Settings → General → Framework Preset** → **Next.js** (if not auto-detected).
4. Redeploy (Deployments → … → Redeploy).

After redeploy, the home page should show the Modular Gunworks header/hero (not 404).

## Do not do yet

- Add **modulargunworks.com** as a custom domain (wait for QA).
- Stop WordPress or `ledger.service` on Lightsail.

## Preview URL

Use the `*.vercel.app` URL from the latest deployment. A gray banner notes that the live store is still on modulargunworks.com.

## Environment variables (later)

Add in Vercel → Settings → Environment Variables (see `apps/store/.env.example`).
