# Deploy theme from Git → Lightsail

**Custom MGW plugins** (`mgw-chattanooga-sync`, `mgw-crypto-polyfill`, `mgw-populate-filter-attributes`, `mgw-sales-tax`, `mgw-image-count`) are **not in this repo** anymore — keep them only on the server or restore from Git history if needed.

Use this checklist after you push. Adjust paths if your Bitnami layout differs.

## One-command staging deploy (recommended)

For the normalized/plugin-native branch, run:

```bash
cd ~/modulargunworksllc.github.io
chmod +x wordpress-package/scripts/deploy-normalized-staging.sh
bash wordpress-package/scripts/deploy-normalized-staging.sh cursor/normalize-wp-plugin-native-97d8
```

If your PaymentHub plugin has a known WordPress.org slug, auto-install/activate it too:

```bash
cd ~/modulargunworksllc.github.io
PAYMENTHUB_PLUGIN_SLUG=your-paymenthub-slug bash wordpress-package/scripts/deploy-normalized-staging.sh cursor/normalize-wp-plugin-native-97d8
```

What this does:
- checks out and pulls the branch
- deploys **legacy** `modulargunworks` theme only (no `mgw-*` copy from Git)
- removes deprecated `mgw-force-cart-checkout` plugin
- installs/activates free plugins (WooCommerce, Age Gate, Contact Form 7) via WP-CLI when available
- optionally installs PaymentHub when `PAYMENTHUB_PLUGIN_SLUG` is provided
- normalizes Cart/Checkout page shortcodes
- creates/updates Contact Form 7 forms (`Contact`, `Service Request`) and wires templates
- restarts PHP-FPM and clears transients

## Paths

| On server (typical Bitnami) | Source in repo |
|----------------------------|----------------|
| `/bitnami/wordpress/wp-content/themes/modulargunworks/` | `wordpress-package/modulargunworks/` |
| `/bitnami/wordpress/wp-content/themes/modulargunworks-shell/` | `wordpress-package/modulargunworks-shell/` (use `deploy-greenfield-shell.sh`) |

## 1. Pull on the server (if this repo is cloned there)

```bash
cd ~/modulargunworksllc.github.io   # or your clone path
git pull origin main
```

## 2. Copy theme

From the clone directory:

```bash
sudo cp -a wordpress-package/modulargunworks/. /bitnami/wordpress/wp-content/themes/modulargunworks/
sudo chown -R daemon:daemon /bitnami/wordpress/wp-content/themes/modulargunworks
```

## 3. Greenfield shell theme (optional)

```bash
bash wordpress-package/scripts/deploy-greenfield-shell.sh cursor/normalize-wp-plugin-native-97d8
```

## 4. PHP-FPM / Apache (optional)

```bash
sudo /opt/bitnami/ctlscript.sh restart php-fpm
```

## 5. Cache

- **Breeze:** WordPress admin → Breeze → purge all caches (or equivalent).  
- **Browser:** hard refresh when verifying CSS/JS.

## 6. Smoke test

- Shop grid and a single product page  
- Cart thumbnail and checkout  
- Any filter/AJAX shop flows you recently changed  
- Confirm legacy static paths 301 to Woo canonical routes:
  - `/shop/*.html` → `/product-category/*` / `/shop/`
  - `/product-detail.html?sku=...` → matching Woo product permalink when SKU exists
- Confirm noindex header behavior on legacy `.html` paths
- Verify canonical nav links only point to:
  - `/shop/`
  - `/product-category/*`
  - `/cart/`
  - `/checkout/`
  - `/my-account/`
- Verify category filters and images:
  - non-empty `pa_*` terms for active categories
  - product cards/PDP/cart image fallback behavior

## 7. Woo-first migration ops (Phase D/E/F)

Run this after code deploy to execute full catalog/facet migration checks:

```bash
cd ~/modulargunworksllc.github.io
sudo /opt/bitnami/wp-cli/bin/wp --path=/opt/bitnami/wordpress eval-file wordpress-package/scripts/wp-storefront-migration-ops.php
```

This script:
- runs Chattanooga sync batches to completion (bounded),
- runs attribute backfill,
- deduplicates sidebar filters to avoid programmatic+widget overlap,
- verifies non-empty `pa_*` facets by top category,
- prints deployment readiness guidance.

## See also

- [`RUNTIME-STACK.md`](RUNTIME-STACK.md) — what else runs on production (not copied from Git)  
- [`DEPLOY-EVERYTHING.md`](DEPLOY-EVERYTHING.md) — cart/checkout/GunTab bootstrap  
