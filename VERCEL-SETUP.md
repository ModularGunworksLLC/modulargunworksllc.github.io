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

## Catalog on Vercel (Chattanooga → Turso — not Lightsail)

The shop does **not** pull products from WordPress. Flow:

1. **Chattanooga API** credentials from Lightsail (`sync-env-from-wordpress.sh`)  
2. **Turso** database (`TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN`)  
3. **POST** `/api/catalog/sync` (or 4h cron) fills the DB  
4. `/shop` reads **only Turso**

See `apps/store/ENV.md` and `apps/store/CATALOG.md`.

## Environment variables (Chattanooga direct sync — optional)

**Source on Lightsail:** WordPress `wp-config.php` defines `MGW_CHATTANOOGA_API_SID` / `MGW_CHATTANOOGA_API_TOKEN` (same as the Chattanooga sync plugin).

**Automated push (agent or you, on Lightsail):**

```bash
# 1) Create token: https://vercel.com/account/tokens
export VERCEL_TOKEN="..."   # do not paste in chat

# 2) Extract from wp-config → ~/.config/mgw/vercel-store.env (chmod 600)
apps/store/scripts/extract-store-env.sh > ~/.config/mgw/vercel-store.env
chmod 600 ~/.config/mgw/vercel-store.env

# 3) Push to project modulargunworksllc-github-io
apps/store/scripts/push-vercel-env.sh

# 4) Redeploy production (Deployments → ⋯ → Redeploy)
```

**Manual:** Vercel → **Settings → Environment Variables** → import `~/.config/mgw/vercel-store.env` or paste keys from `apps/store/.env.example`.

**Test after redeploy:**  
`https://modulargunworksllc-github-io.vercel.app/api/catalog/sample?limit=5`

Ledger (`Bankledger/.env`) is for a **separate** Vercel project later — not mixed into the store project.
