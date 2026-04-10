# Greenfield shell on current Lightsail (theme + optional catalog wipe)

## What this does

1. **`modulargunworks-shell`** — New theme: same **header, footer, home page, CSS/images**, thin **WooCommerce** wrapper (default Woo templates). No legacy custom `woocommerce/*.php` overrides from the old theme.
2. **Credentials** — Stay in **`wp-config.php`**, **`.env`**, and **`wp_options`**. This process does not remove them.
3. **Products** — Removing products is **separate** (script below). After wipe, run **Chattanooga Sync** when you are ready.

## 1) Snapshot

Lightsail snapshot + database export if possible.

## 2) Pull and deploy shell (on the server)

```bash
cd ~/modulargunworksllc.github.io
git fetch origin
git checkout cursor/normalize-wp-plugin-native-97d8   # or your branch with shell theme
git pull origin cursor/normalize-wp-plugin-native-97d8

bash wordpress-package/scripts/deploy-greenfield-shell.sh cursor/normalize-wp-plugin-native-97d8
```

By default this **does not** run the long `wp-storefront-migration-ops.php` sync. To run normalization only:

```bash
MGW_GREENFIELD_RUN_NORMALIZE=1 bash wordpress-package/scripts/deploy-greenfield-shell.sh
```

To also run full migration/sync:

```bash
MGW_GREENFIELD_RUN_MIGRATION=1 bash wordpress-package/scripts/deploy-greenfield-shell.sh
```

## 3) Wipe catalog — products only (shell + empty store)

This removes **all products and variations** and resets Chattanooga sync pointers. It does **not** remove:

- WordPress **pages** (About, Contact, …)
- **Users** or **orders** (see §3b if you also want orders gone)
- **Plugin settings** (Chattanooga SID/token, payment gateways in `wp_options`)

```bash
REPO="$HOME/modulargunworksllc.github.io"
WP_PATH="/opt/bitnami/wordpress"
# If your core lives under /bitnami/wordpress, use: WP_PATH="/bitnami/wordpress"

sudo /opt/bitnami/wp-cli/bin/wp eval-file \
  "$REPO/wordpress-package/scripts/wp-greenfield-delete-all-products.php" \
  --path="$WP_PATH"
```

Optional — rebuild Woo lookup tables if the script logs a notice or admin shows odd counts:

```bash
sudo /opt/bitnami/wp-cli/bin/wp wc tool run regenerate_product_lookup_tables --path="$WP_PATH" 2>/dev/null || true
```

Then **purge cache** (Breeze, Cloudflare, browser).

### 3b) Also delete orders (optional, stronger reset)

**Destructive** for accounting — export orders first if you need history.

```bash
sudo /opt/bitnami/wp-cli/bin/wp post delete \
  $(sudo /opt/bitnami/wp-cli/bin/wp post list --post_type=shop_order --format=ids --path="$WP_PATH") \
  --force --path="$WP_PATH"
```

Repeat for `shop_order_refund` if present. Many stores skip this and only wipe products.

## 4) Optional — remove old theme folder

After you confirm the shell theme works:

```bash
sudo rm -rf /bitnami/wordpress/wp-content/themes/modulargunworks
# or: /opt/bitnami/wordpress/wp-content/themes/modulargunworks
sudo chown -R daemon:daemon /bitnami/wordpress/wp-content/themes
```

## 5) Deactivate extra plugins

In **wp-admin → Plugins**, turn off anything you no longer need (e.g. duplicate filter plugins). Keep **WooCommerce**, **Chattanooga Sync**, payments, security.

## 6) Re-import catalog (when ready)

**Settings → Chattanooga Sync → Sync Now** (or cron). First run after wipe will walk the feed from the start (`mgw_chattanooga_batch_offset` was reset by the delete script).
