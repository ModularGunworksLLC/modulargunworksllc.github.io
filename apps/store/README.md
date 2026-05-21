# Modular Gunworks — Vercel storefront (Next.js)

Rebuild of the live WordPress theme for [Vercel Hobby](https://vercel.com). **Does not replace production** until DNS cutover.

## Vercel project settings (required after first push)

In the Vercel dashboard for this GitHub repo:

| Setting | Value |
|---------|--------|
| **Root Directory** | `apps/store` |
| **Framework Preset** | Next.js |
| **Production Branch** | `main` |

Do **not** attach `modulargunworks.com` until QA passes on the `*.vercel.app` preview URL.

## Local dev

```bash
cd apps/store
npm install
npm run dev
```

Open http://localhost:3000

## Theme assets

CSS and images are copied from [`wordpress-package/modulargunworks/`](../../wordpress-package/modulargunworks/) into `public/theme/`. Re-sync when the WordPress theme changes on Lightsail.

## Phases

1. **Done (scaffold):** Home, header/footer, static pages, shop/cart/checkout placeholders.
2. **Next:** Product catalog API + filters (replace `mgw-chattanooga-sync`).
3. **Next:** Checkout (PaymentHub or GunTab).
4. **Last:** DNS cutover after side-by-side QA vs modulargunworks.com.

## API

- `GET /api/health` — deployment check
