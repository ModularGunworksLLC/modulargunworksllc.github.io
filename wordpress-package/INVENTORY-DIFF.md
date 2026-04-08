# Lightsail vs `wordpress-package` inventory (2026-04-08)

Generated on the Modular Gun Works Lightsail host. **Authoritative theme/plugins**: `/bitnami/wordpress/wp-content/themes/modulargunworks` and `wp-content/plugins/mgw-*`.

## Theme diff summary (`diff -rq`)

The following differences were observed **before** syncing this clone to Lightsail:

| Kind | Notes |
|------|--------|
| Files differ | `assets/css/layout.css`, `footer.php`, `functions.php`, `page-contact.php`, `woocommerce/content-product.php`, `woocommerce/content-single-product.php`, `woocommerce/loop/pagination.php`, `woocommerce/single-product.php` |
| Only on Lightsail (noise) | `functions.php.bak*`, `includes/class-mgw-catalog-query.php.bak-*`, `woocommerce/sidebar-shop-filters.php.new`, root `woocommerce.css` (stray copy) |
| Only on Lightsail (real) | `woocommerce/global/` directory |

**Action:** Repo `wordpress-package/modulargunworks` was refreshed from Lightsail; backup `*.bak` / `*.new` files were removed from the package copy only.

## Custom plugins (`mgw-*`)

Compared with `wordpress-package/plugins/`:

| Plugin | Notes |
|--------|--------|
| `mgw-chattanooga-sync` | No file diff reported in quick check (in sync). |
| `mgw-crypto-polyfill` | Live `mgw-crypto-polyfill.php` differed from package — refreshed from Lightsail. |
| `mgw-force-cart-checkout` | Live differed — refreshed from Lightsail. |
| `mgw-populate-filter-attributes` | `includes/class-mgw-populate-attrs.php` differed — refreshed from Lightsail. |
| `mgw-sales-tax` | No diff in sample check — refreshed from Lightsail for parity. |
| **`mgw-image-count`** | Was a **single file** on Lightsail: `wp-content/plugins/mgw-image-count-plugin.php` — **not** in Git. Added as proper directory plugin under `wordpress-package/plugins/mgw-image-count/`. |

## WP-CLI on Bitnami

`wp plugin list` requires the Bitnami wrapper user/superuser setup; versions for **RUNTIME-STACK.md** were taken from plugin file headers instead.
