# Deploy Everything – WooCommerce canonical checkout only

This runbook supersedes the old static checkout + force-template path.

## Canonical architecture

- Customer-facing checkout is **WooCommerce pages only**:
  - `/shop/`
  - `/product-category/*`
  - `/cart/`
  - `/checkout/`
  - `/my-account/`
- Legacy static checkout endpoints are disabled by default and should not be used for storefront checkout.

## Required setup (server)

1. Deploy latest theme/plugins from Git:
   - Use `DEPLOY-FROM-GIT.md` and/or:
   - `bash wordpress-package/scripts/deploy-normalized-staging.sh <branch>`
2. Ensure WooCommerce + payment gateway plugin (GunTab) are installed and active in wp-admin.
3. Run migration ops:
   ```bash
   sudo wp --path=/opt/bitnami/wordpress eval-file wordpress-package/scripts/wp-storefront-migration-ops.php
   ```
4. Keep legacy static URLs disabled:
   - Option `mgw_enable_legacy_static_urls` should be `false` (default).

## Smoke tests (must pass)

1. Shop/category pages load and filter sidebar renders.
2. Product detail pages load with image, price, stock, add-to-cart.
3. Cart and checkout render WooCommerce content.
4. Checkout enforces shipping selection when shipping is required.
5. GunTab payment option appears in Woo payments and can create a checkout session from Woo flow.
6. Legacy static URLs (for example `/shop/ammunition.html`, `/product-detail.html?sku=...`) 301 to canonical Woo URLs.

## Notes

- `mgw-force-cart-checkout` is deprecated and should remain removed.
- `mgw-crypto-polyfill` can remain installed for browser compatibility, but checkout flow ownership is Woo + gateway plugin.
- Static `legacy/github-pages-static/serve.js` is archived behavior; `/api/guntab-create-invoice` now returns 410 by default.
