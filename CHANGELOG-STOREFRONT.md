# Storefront Refactor Changelog

## Greenfield shell theme

- Added **`modulargunworks-shell`** theme: `header.php` / `footer.php`, home page, copied `assets/` (CSS, images), `woocommerce.php` wrapper only (no custom archive/single overrides).
- **`scripts/deploy-greenfield-shell.sh`**: deploy shell + refresh `mgw-*` plugins, `wp theme activate modulargunworks-shell`; optional `MGW_GREENFIELD_RUN_NORMALIZE` / `MGW_GREENFIELD_RUN_MIGRATION`.
- **`scripts/wp-greenfield-delete-all-products.php`**: batch-delete all products and reset `mgw_chattanooga_batch_offset` (run via `wp eval-file`).
- **`docs/GREENFIELD-SERVER-STEPS.md`**: Lightsail checklist (deploy, optional wipe, re-sync).

## Canvas reset (theme)

- Empty shop/category archives use `woocommerce/loop/no-products-found.php` with on-brand messaging and links to home and shop.
- Shop sidebar shows a short note when the main query has zero products instead of an empty Filters chrome; programmatic facets skip all attributes when no products are listed (`sidebar-shop-filters.php`).
- Shop sidebar widget auto-provisioner no longer runs on front-end `init` (only `admin_init`), reducing unnecessary option writes per request.
- Deploy and optional WP-CLI catalog wipe documented in `wordpress-package/docs/CANVAS-RESET-DEPLOY.md`.

## Images
- Chattanooga sync now validates image URLs with SKU-aware logging and keeps invalid/non-empty values visible in logs for diagnosis.
- Sellable products now attempt featured image sideloading after save via `maybe_set_featured_image_from_feed()` while preserving `_chattanooga_image_url` meta fallback.
- Sideload failures no longer interrupt sync batches; they are caught and logged with SKU/product context.
- Theme cart thumbnails now route through Woo product image rendering so featured image > Chattanooga meta > placeholder behavior is consistent.
- Woo REST product responses now include `mgw_chattanooga_image_url` for API consumers.
- Static shop product cards now apply an `onerror` image fallback to the same placeholder used for missing images.

## Filters
- Added vendor-map/normalizer support for new attributes: `gauge`, `velocity`, `shot_size`, `casing`, `product_line`, `style`.
- Chattanooga sync now writes these fields to corresponding Woo attribute taxonomies (`pa_*`) when present.
- Round count now also populates `pa_rounds` (in addition to `_round_count` and `_price_per_round` meta).
- Firearm-category products now fall back to title-based caliber extraction when CSV caliber is empty.
- Added `woocommerce/sidebar-shop-filters.php` for programmatic, category-aware layered-nav blocks.
- Updated Woo sidebar template to render the new programmatic facets before `dynamic_sidebar('shop-sidebar')`.

## Checkout / Shipping / Legacy
- Woo checkout now enforces a selected shipping method when shipping is required (`woocommerce_checkout_process`, priority 5).
- Legacy static cart no longer initiates GunTab directly; checkout CTA now redirects users to WooCommerce cart/checkout (override with `window.MGW_WOO_STORE_URL`).
- Legacy invoice API now recomputes trusted merchandise totals server-side and rejects client mismatches beyond +/-1 cent.
- Legacy invoice API now enforces shipping amount based on configured free-shipping threshold and flat-rate constants.
- Removed hardcoded Gmail app password from `serve.js`; email sending now requires `GMAIL_USER` + `GMAIL_APP_PASSWORD`, otherwise `/api/send-order-email` returns 503.
- Legacy `/api/guntab-create-invoice` now returns HTTP 410 to enforce Woo-only checkout and eliminate split payment orchestration.
- Added `.env.example` keys for `GMAIL_USER` and `GMAIL_APP_PASSWORD`.

## Canonicalization / Guardrails
- Added WordPress `template_redirect` canonicalization from legacy static routes to Woo routes:
  - `/shop/*.html` -> `/shop/` or mapped `/product-category/*`
  - `/shop/cart.html` and `/cart.html` -> `/cart/`
  - `/shop/checkout.html` and `/checkout.html` -> `/checkout/`
  - `/shop/search.html` -> `/shop/`
  - `/product-detail.html` and `/product-view.html` -> SKU-resolved Woo product permalink when possible, otherwise `/shop/`
- Added noindex headers for legacy static-style `.html` paths as SEO defense-in-depth.
- Updated theme cart JS to always resolve cart URL using Woo permalink (`wc_get_cart_url`) fallback.
- Added WP-CLI migration ops script (`wordpress-package/scripts/wp-storefront-migration-ops.php`) for:
  - full Chattanooga sync loop to completion,
  - filter-attribute backfill,
  - taxonomy/facet verification report,
  - optional de-duplication of layered-nav widgets already rendered programmatically.
- Added CI guardrail workflow (`.github/workflows/legacy-guardrails.yml`) to fail PRs that add/modify app features under `legacy/github-pages-static/` (docs/archive exceptions only).
