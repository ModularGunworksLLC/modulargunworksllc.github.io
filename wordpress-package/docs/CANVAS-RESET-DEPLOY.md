# Canvas reset: deploy theme + optional empty catalog

After a **Lightsail snapshot**, you can roll out this repo’s theme changes and optionally clear WooCommerce products so the storefront matches a **layout-first, empty-shelf** rebuild. **API keys and payment settings live in the database** (`wp_options`) and in `wp-config.php` / server `.env`—do not delete those.

## 1. Deploy the theme

From your machine (adjust paths and host):

```bash
# Example: rsync theme folder to Bitnami/Lightsail WordPress
rsync -avz --delete \
  ./wordpress-package/modulargunworks/ \
  admin@YOUR_SERVER_IP:/opt/bitnami/wordpress/wp-content/themes/modulargunworks/
```

If your image uses `/var/www/html`, change the remote path. Then in **wp-admin → Appearance → Themes**, ensure **Modular Gunworks** is active (or re-activate after upload).

**Importer:** Chattanooga / other `mgw-*` plugins are **not** in this package anymore. Manage them on the server or restore from Git history.

## 2. Deactivate conflicting plugins (on the server)

In **wp-admin → Plugins**, deactivate **duplicate filter** plugins (e.g. Filter Everything) if you are standardizing on the theme’s programmatic layered nav + native Woo widgets. **Do not** deactivate WooCommerce, your payment gateway, or **Chattanooga Sync** if you need the feed.

## 3. Purge caches

Clear **Breeze**, **Cloudflare**, or any page cache so the new templates load.

## 4. Optional: empty the product catalog (WP-CLI)

**Destructive.** Run only if you intend to **re-import** from Chattanooga afterward.

SSH to the server, then (Bitnami often ships WP-CLI):

```bash
cd /opt/bitnami/wordpress
sudo wp plugin list
sudo wp wc tool run clear_transients --user=1
# Delete all products (irreversible without DB restore):
sudo wp post delete $(sudo wp post list --post_type=product --format=ids) --force
```

If your host has no WP-CLI, use a trusted WooCommerce “delete all products” admin tool or phpMyAdmin **only** with a fresh backup.

**Note:** This does **not** remove Chattanooga **credentials** (`mgw_chattanooga_api_sid`, `mgw_chattanooga_api_token`) or WooCommerce **payment** options.

## 5. Re-import catalog

**wp-admin → Chattanooga Sync** (or your cron): run **Sync Now** and let batches complete until the feed offset resets.

## What changed in the theme (this repo)

- **Empty archives:** `woocommerce/loop/no-products-found.php` shows a clear message and links home/shop.
- **Empty sidebar:** When a shop/category query has **zero** products, the filter column shows a short note instead of an empty “Filters” chrome.
- **Facet logic:** Programmatic layered nav skips attribute blocks when **no** products are listed (fixes misleading empty filters on an empty catalog).
- **Performance:** Removed running the shop-sidebar widget auto-provisioner on every front-end `init` (still runs on `admin_init` for setup).
