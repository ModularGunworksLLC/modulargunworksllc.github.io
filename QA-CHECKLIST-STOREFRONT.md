# QA Checklist — Storefront Refactor

Use this checklist after deploy. Mark each line Pass/Fail and capture SKU examples.

## Images

| Test | Expected | Status |
| --- | --- | --- |
| Chattanooga sync writes `_chattanooga_image_url` | Meta is present for sellable SKUs |  |
| Chattanooga sync sets featured image (`_thumbnail_id`) | Sellable SKUs get attachment thumbnails |  |
| Invalid image URL logging | SKU + raw URL appears in logs when URL is non-empty and invalid |  |
| Shop archive image render | Featured image appears; if missing, Chattanooga image fallback appears |  |
| Single product image render | Featured image appears; if placeholder, Chattanooga fallback appears |  |
| Cart line-item thumbnails | Same image behavior as product tiles (no placeholder drift) |  |
| Legacy static product cards | Broken image URLs swap to product placeholder icon |  |
| Woo REST payload image extension | `mgw_chattanooga_image_url` appears in product response |  |

## Filters

| Test | Expected | Status |
| --- | --- | --- |
| Programmatic layered nav blocks render | New facet blocks appear when taxonomies/terms exist |  |
| Ammo category facets | Bullet type, grain, rounds, gauge, velocity, shot size, casing appear when populated |  |
| Firearms category facets | Style appears when populated |  |
| Generic facets | Brand, caliber, capacity, product line appear when populated |  |
| No duplicate attribute blocks | Programmatic blocks do not render for attributes already present in layered-nav widgets |  |
| Sidebar stacking | `sidebar-shop-filters.php` renders before `dynamic_sidebar('shop-sidebar')` |  |
| Sync mapping population | New CSV columns map into normalized keys and product attributes |  |
| Round count facet assignment | `pa_rounds` set when round count > 0 |  |

## Checkout / Shipping / Legacy

| Test | Expected | Status |
| --- | --- | --- |
| Woo checkout shipping requirement | `woocommerce_checkout_process` blocks order when shipping needed but no method selected |  |
| Legacy cart CTA | Button routes to Woo checkout URL (optionally overridden by `window.MGW_WOO_STORE_URL`) |  |
| Legacy GunTab direct checkout removed from cart page | No direct API checkout action from static cart UI |  |
| Legacy API deprecation | `/api/guntab-create-invoice` returns `410` and instructs Woo checkout usage |  |
| Legacy checkout single source of truth | No static API path can create payment sessions directly |  |
| Email env requirement | `/api/send-order-email` returns 503 when `GMAIL_USER`/`GMAIL_APP_PASSWORD` missing |  |
| Hardcoded mail password removed | No embedded Gmail app password in `serve.js` |  |

## Canonicalization / Redirects / Guardrails

| Test | Expected | Status |
| --- | --- | --- |
| Legacy shop URL redirect | `/shop/*.html` returns 301 to matching Woo URL |  |
| Legacy product detail redirect | `/product-detail.html?sku=...` resolves to Woo product permalink when SKU exists |  |
| Legacy fallback redirect | Unresolvable `/product-detail.html` redirects to `/shop/` |  |
| Legacy search/cart redirects | `/shop/search.html`, `/shop/cart.html`, `/cart.html` redirect to Woo routes |  |
| Noindex header | Legacy `.html` paths include `X-Robots-Tag: noindex, nofollow` |  |
| Legacy feature policy CI | CI fails when non-allowed files under `legacy/github-pages-static/` change |  |
| Woo smoke checklist in docs | Deploy docs include shop/category/PDP/cart/checkout/filter/image smoke tests |  |

## Smoke / Regression

| Test | Expected | Status |
| --- | --- | --- |
| PHP syntax check | No syntax errors in updated PHP files |  |
| Node syntax check | No syntax errors in updated JS files |  |
| Frontend console errors | No new JS runtime errors on shop/cart pages |  |
| Baseline product visibility | Sellable products remain published and purchasable |  |

