#!/usr/bin/env bash
set -euo pipefail

# Deploys the normalized theme branch to a Lightsail/Bitnami staging instance.
#
# Usage:
#   bash wordpress-package/scripts/deploy-normalized-staging.sh cursor/normalize-wp-plugin-native-97d8
#
# Optional env:
#   REPO_DIR=~/modulargunworksllc.github.io
#   PAYMENTHUB_PLUGIN_SLUG=paymenthubs

BRANCH="${1:-${BRANCH:-cursor/normalize-wp-plugin-native-97d8}}"
REPO_DIR="${REPO_DIR:-$HOME/modulargunworksllc.github.io}"

detect_wp_content_path() {
  if [[ -d /bitnami/wordpress/wp-content ]]; then
    echo "/bitnami/wordpress"
    return 0
  fi
  if [[ -d /opt/bitnami/wordpress/wp-content ]]; then
    echo "/opt/bitnami/wordpress"
    return 0
  fi
  if [[ -d /var/www/html/wp-content ]]; then
    echo "/var/www/html"
    return 0
  fi
  return 1
}

detect_wp_core_path() {
  if [[ -f /opt/bitnami/wordpress/wp-load.php ]]; then
    echo "/opt/bitnami/wordpress"
    return 0
  fi
  if [[ -f /bitnami/wordpress/wp-load.php ]]; then
    echo "/bitnami/wordpress"
    return 0
  fi
  if [[ -f /var/www/html/wp-load.php ]]; then
    echo "/var/www/html"
    return 0
  fi
  return 1
}

WP_CONTENT_PATH="${WP_CONTENT_PATH:-$(detect_wp_content_path || true)}"
WP_CORE_PATH="${WP_CORE_PATH:-${WP_PATH:-$(detect_wp_core_path || true)}}"

if [[ -z "$WP_CONTENT_PATH" ]]; then
  echo "Could not detect WordPress content path. Set WP_CONTENT_PATH explicitly."
  exit 1
fi

if [[ -z "$WP_CORE_PATH" ]]; then
  echo "Could not detect WordPress core path (wp-load.php). Set WP_CORE_PATH explicitly."
  exit 1
fi

WP_CONTENT="$WP_CONTENT_PATH/wp-content"
THEME_TARGET="$WP_CONTENT/themes/modulargunworks"
PLUGIN_TARGET="$WP_CONTENT/plugins"

if [[ ! -d "$REPO_DIR" ]]; then
  echo "Repo directory not found: $REPO_DIR"
  exit 1
fi

echo "==> Using repo: $REPO_DIR"
echo "==> Using WordPress content path: $WP_CONTENT_PATH"
echo "==> Using WordPress core path: $WP_CORE_PATH"
echo "==> Deploying branch: $BRANCH"

cd "$REPO_DIR"

git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull origin "$BRANCH"

echo "==> Deploying theme"
sudo mkdir -p "$THEME_TARGET"
sudo cp -a wordpress-package/modulargunworks/. "$THEME_TARGET/"

echo "==> Deploying custom MGW plugins"
for d in mgw-chattanooga-sync mgw-crypto-polyfill mgw-populate-filter-attributes mgw-sales-tax mgw-image-count; do
  sudo mkdir -p "$PLUGIN_TARGET/$d"
  sudo cp -a "wordpress-package/plugins/$d/." "$PLUGIN_TARGET/$d/"
done

echo "==> Removing deprecated custom-force plugin"
sudo rm -rf "$PLUGIN_TARGET/mgw-force-cart-checkout"
sudo rm -f "$PLUGIN_TARGET/mgw-image-count-plugin.php"

echo "==> Applying ownership"
if id daemon >/dev/null 2>&1; then
  sudo chown -R daemon:daemon "$THEME_TARGET" "$PLUGIN_TARGET"/mgw-*
else
  # Bitnami fallback user/group
  sudo chown -R bitnami:daemon "$THEME_TARGET" "$PLUGIN_TARGET"/mgw-* || true
fi

echo "==> Restarting services"
if [[ -x /opt/bitnami/ctlscript.sh ]]; then
  sudo /opt/bitnami/ctlscript.sh restart php-fpm || true
  sudo /opt/bitnami/ctlscript.sh restart apache || true
fi

WP_CLI_BIN="${WP_CLI_BIN:-/opt/bitnami/wp-cli/bin/wp}"
if [[ ! -x "$WP_CLI_BIN" ]]; then
  if command -v wp >/dev/null 2>&1; then
    WP_CLI_BIN="$(command -v wp)"
  else
    echo "wp-cli not found; skipping automation step."
    echo "Deployment complete. Configure plugins/forms manually in wp-admin."
    exit 0
  fi
fi

echo "==> Running WordPress normalization setup via wp-cli"
wp_cmd=(sudo "$WP_CLI_BIN" --path="$WP_CORE_PATH")

install_activate_free_plugin() {
  local slug="$1"
  local label="$2"
  echo "==> Ensuring plugin: $label ($slug)"
  if "${wp_cmd[@]}" plugin is-installed "$slug" >/dev/null 2>&1; then
    "${wp_cmd[@]}" plugin activate "$slug" >/dev/null 2>&1 || true
    return 0
  fi
  # Install from WordPress.org when available; continue if unavailable.
  if "${wp_cmd[@]}" plugin install "$slug" --activate >/dev/null 2>&1; then
    return 0
  fi
  echo "    ! Could not auto-install $slug. Install/activate manually in wp-admin."
}

install_activate_free_plugin "woocommerce" "WooCommerce"
install_activate_free_plugin "age-gate" "Age Gate"
install_activate_free_plugin "contact-form-7" "Contact Form 7"

if [[ -n "${PAYMENTHUB_PLUGIN_SLUG:-}" ]]; then
  install_activate_free_plugin "$PAYMENTHUB_PLUGIN_SLUG" "PaymentHub"
else
  echo "==> PaymentHub slug not provided (set PAYMENTHUB_PLUGIN_SLUG to auto-install)."
fi

"${wp_cmd[@]}" eval-file "$REPO_DIR/wordpress-package/scripts/wp-normalize-setup.php"
echo "==> Running storefront migration ops (redirects/facets verification)"
"${wp_cmd[@]}" eval-file "$REPO_DIR/wordpress-package/scripts/wp-storefront-migration-ops.php"

echo ""
echo "Done. Visit your staging URL and verify:"
echo "  - Shop/filter widgets"
echo "  - Cart/Checkout content"
echo "  - Contact + Service Request forms"
echo "  - Age Gate plugin behavior"
