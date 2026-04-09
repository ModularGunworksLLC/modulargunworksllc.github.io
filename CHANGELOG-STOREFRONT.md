# Storefront Refactor Changelog

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
- Added `.env.example` keys for `GMAIL_USER` and `GMAIL_APP_PASSWORD`.
