# Deploy theme and MGW plugins from Git → Lightsail

Use this as the **single** checklist after you push to `main`. Adjust paths if your Bitnami layout differs.

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
- deploys theme + MGW plugins
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
| `/bitnami/wordpress/wp-content/plugins/mgw-*` | `wordpress-package/plugins/mgw-*` |

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

## 3. Copy custom plugins

```bash
for d in mgw-chattanooga-sync mgw-crypto-polyfill mgw-populate-filter-attributes mgw-sales-tax mgw-image-count; do
  sudo mkdir -p "/bitnami/wordpress/wp-content/plugins/$d"
  sudo cp -a "wordpress-package/plugins/$d/." "/bitnami/wordpress/wp-content/plugins/$d/"
done
sudo chown -R daemon:daemon /bitnami/wordpress/wp-content/plugins/mgw-*
```

### `mgw-image-count` vs legacy single file

If the server still has **`wp-content/plugins/mgw-image-count-plugin.php`** (root-level single file), remove it after the directory plugin is in place so WordPress does not load the plugin twice:

```bash
sudo rm -f /bitnami/wordpress/wp-content/plugins/mgw-image-count-plugin.php
```

Then activate **MGW Product Image Count** from **Plugins** if needed (path: `mgw-image-count/mgw-image-count-plugin.php`).

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

## See also

- [`RUNTIME-STACK.md`](RUNTIME-STACK.md) — what else runs on production (not copied from Git)  
- [`DEPLOY-EVERYTHING.md`](DEPLOY-EVERYTHING.md) — cart/checkout/GunTab bootstrap  
