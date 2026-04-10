#!/usr/bin/env bash
set -euo pipefail

# Deploy greenfield "shell" theme + refresh MGW plugins; activate shell theme.
# Does NOT run Chattanooga sync or storefront migration unless you opt in.
#
# Usage (on the Lightsail host, from repo root):
#   bash wordpress-package/scripts/deploy-greenfield-shell.sh [branch]
#
# Env:
#   REPO_DIR, WP_CONTENT_PATH, WP_CORE_PATH (same as deploy-normalized-staging.sh)
#   MGW_GREENFIELD_RUN_NORMALIZE=1  — run wp-normalize-setup.php after deploy
#   MGW_GREENFIELD_RUN_MIGRATION=1 — run wp-storefront-migration-ops.php (sync batches)

BRANCH="${1:-${BRANCH:-cursor/normalize-wp-plugin-native-97d8}}"
REPO_DIR="${REPO_DIR:-$HOME/modulargunworksllc.github.io}"

detect_wp_content_path() {
  if [[ -d /bitnami/wordpress/wp-content ]]; then echo "/bitnami/wordpress"; return 0; fi
  if [[ -d /opt/bitnami/wordpress/wp-content ]]; then echo "/opt/bitnami/wordpress"; return 0; fi
  if [[ -d /var/www/html/wp-content ]]; then echo "/var/www/html"; return 0; fi
  return 1
}

detect_wp_core_path() {
  if [[ -f /opt/bitnami/wordpress/wp-load.php ]]; then echo "/opt/bitnami/wordpress"; return 0; fi
  if [[ -f /bitnami/wordpress/wp-load.php ]]; then echo "/bitnami/wordpress"; return 0; fi
  if [[ -f /var/www/html/wp-load.php ]]; then echo "/var/www/html"; return 0; fi
  return 1
}

WP_CONTENT_PATH="${WP_CONTENT_PATH:-$(detect_wp_content_path || true)}"
WP_CORE_PATH="${WP_CORE_PATH:-$(detect_wp_core_path || true)}"

if [[ -z "${WP_CONTENT_PATH}" || -z "${WP_CORE_PATH}" ]]; then
  echo "Set WP_CONTENT_PATH and WP_CORE_PATH (could not auto-detect)."
  exit 1
fi

WP_CONTENT="${WP_CONTENT_PATH}/wp-content"
THEME_SHELL="${WP_CONTENT}/themes/modulargunworks-shell"
PLUGIN_TARGET="${WP_CONTENT}/plugins"

if [[ ! -d "$REPO_DIR" ]]; then
  echo "Repo not found: $REPO_DIR"
  exit 1
fi

cd "$REPO_DIR"
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull origin "$BRANCH"

echo "==> Deploying modulargunworks-shell theme"
sudo mkdir -p "$THEME_SHELL"
sudo cp -a wordpress-package/modulargunworks-shell/. "$THEME_SHELL/"

echo "==> Refreshing MGW plugins (same set as normalized deploy)"
for d in mgw-chattanooga-sync mgw-crypto-polyfill mgw-populate-filter-attributes mgw-sales-tax mgw-image-count; do
  if [[ -d "wordpress-package/plugins/$d" ]]; then
    sudo mkdir -p "$PLUGIN_TARGET/$d"
    sudo cp -a "wordpress-package/plugins/$d/." "$PLUGIN_TARGET/$d/"
  fi
done

sudo rm -rf "$PLUGIN_TARGET/mgw-force-cart-checkout"
sudo rm -f "$PLUGIN_TARGET/mgw-image-count-plugin.php"

if id daemon >/dev/null 2>&1; then
  sudo chown -R daemon:daemon "$THEME_SHELL" "$PLUGIN_TARGET"/mgw-* 2>/dev/null || true
else
  sudo chown -R bitnami:daemon "$THEME_SHELL" "$PLUGIN_TARGET"/mgw-* 2>/dev/null || true
fi

if [[ -x /opt/bitnami/ctlscript.sh ]]; then
  sudo /opt/bitnami/ctlscript.sh restart php-fpm || true
  sudo /opt/bitnami/ctlscript.sh restart apache || true
fi

WP_CLI_BIN="${WP_CLI_BIN:-/opt/bitnami/wp-cli/bin/wp}"
if [[ ! -x "$WP_CLI_BIN" ]]; then
  WP_CLI_BIN="$(command -v wp || true)"
fi

if [[ -z "$WP_CLI_BIN" || ! -x "$WP_CLI_BIN" ]]; then
  echo "wp-cli not found. Theme files copied — activate 'Modular Gunworks Shell' in wp-admin."
  exit 0
fi

wp_cmd=(sudo "$WP_CLI_BIN" --path="$WP_CORE_PATH")

echo "==> Activating Modular Gunworks Shell theme"
"${wp_cmd[@]}" theme activate modulargunworks-shell

if [[ "${MGW_GREENFIELD_RUN_NORMALIZE:-}" == "1" ]]; then
  echo "==> Running wp-normalize-setup.php"
  "${wp_cmd[@]}" eval-file "$REPO_DIR/wordpress-package/scripts/wp-normalize-setup.php"
fi

if [[ "${MGW_GREENFIELD_RUN_MIGRATION:-}" == "1" ]]; then
  echo "==> Running wp-storefront-migration-ops.php"
  "${wp_cmd[@]}" eval-file "$REPO_DIR/wordpress-package/scripts/wp-storefront-migration-ops.php"
else
  echo "==> Skipping storefront migration (set MGW_GREENFIELD_RUN_MIGRATION=1 to run sync/migration)."
fi

"${wp_cmd[@]}" cache flush 2>/dev/null || true
echo "Done. Purge CDN/hosting cache if applicable. Run product wipe separately if desired (see docs/GREENFIELD-SERVER-STEPS.md)."
