# Environment — pull from Lightsail WordPress, deploy to Vercel

Vercel does **not** read from Lightsail at runtime. It uses:

1. **Chattanooga API** → sync job → **Turso database** → shop pages  
2. Secrets copied from Lightsail once into Vercel env vars  

## 1. On Lightsail (this server)

```bash
cd /home/bitnami/modulargunworksllc.github.io/apps/store
./scripts/sync-env-from-wordpress.sh   # writes .env.local (never commit)
```

Sources:

| Secret | Where on Lightsail |
|--------|-------------------|
| Chattanooga SID/token | `wp-config.php` `MGW_CHATTANOOGA_*` |
| Ledger intake | `wp-config.php` `MGW_LEDGER_*` |
| PaymentHub EPX | WP option `woocommerce_epx_settings` |
| GunTab | WP option `woocommerce_guntab_settings`, `guntab_webhook_key` |
| Cron auth | generated `CRON_SECRET` |

## 2. Turso catalog database (required for shop on Vercel)

1. Create a free database at [turso.tech](https://turso.tech) (or `turso db create mgw-catalog`).  
2. Copy **Database URL** and **auth token** into `.env.local`:

```bash
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...
```

## 3. Push all env vars to Vercel

```bash
export VERCEL_TOKEN="..."   # https://vercel.com/account/tokens — do not paste in chat
./scripts/push-vercel-env.sh
```

Add Turso vars to `.env.local` before pushing if not already there.

## 4. First catalog sync

After deploy:

```bash
curl -X POST "https://modulargunworksllc-github-io.vercel.app/api/catalog/sync" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Or wait for the 4-hour Vercel cron in `vercel.json`.

## 5. Verify

- `/api/catalog/sample?limit=5` — products from Turso  
- `/shop` — grid from Turso (not WordPress)  

Lightsail **modulargunworks.com** is unchanged; only the Vercel preview uses this pipeline.
