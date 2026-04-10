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

## 3) Optional — delete all products (irreversible)

```bash
sudo /opt/bitnami/wp-cli/bin/wp eval-file \
  /home/bitnami/modulargunworksllc.github.io/wordpress-package/scripts/wp-greenfield-delete-all-products.php \
  --path=/opt/bitnami/wordpress
```

Adjust `--path` and repo path if your layout differs (`/bitnami/wordpress` on some images).

Then **purge cache** (Breeze, Cloudflare, browser).

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
