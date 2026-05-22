#!/usr/bin/env bash
# Print store env vars (KEY=value) from Lightsail WordPress wp-config.
# Output is sensitive — redirect to a file with chmod 600, never commit.
set -euo pipefail

WP_CONFIG="${WP_CONFIG:-/opt/bitnami/wordpress/wp-config.php}"

read_wp_define() {
  local name="$1"
  sudo grep -E "define\(\s*'${name}'" "$WP_CONFIG" 2>/dev/null \
    | head -1 \
    | sed -n "s/.*'${name}',\s*'\([^']*\)'.*/\1/p"
}

CHATT_SID="$(read_wp_define MGW_CHATTANOOGA_API_SID)"
CHATT_TOKEN="$(read_wp_define MGW_CHATTANOOGA_API_TOKEN)"

if [[ -z "$CHATT_SID" || -z "$CHATT_TOKEN" ]]; then
  echo "ERROR: MGW_CHATTANOOGA_* not found in $WP_CONFIG" >&2
  exit 1
fi

read_wp_home() {
  sudo grep -E "define\(\s*'WP_HOME'" "$WP_CONFIG" 2>/dev/null \
    | head -1 \
    | sed -n "s/.*'WP_HOME',\s*'\([^']*\)'.*/\1/p"
}

CRON_SECRET="${CRON_SECRET:-$(openssl rand -hex 32)}"
PREVIEW_URL="${NEXT_PUBLIC_SITE_URL:-https://modulargunworksllc-github-io.vercel.app}"
LIVE_URL="${NEXT_PUBLIC_LIVE_STORE_URL:-$(read_wp_home)}"
LIVE_URL="${LIVE_URL:-https://www.modulargunworks.com}"
WP_STORE="${NEXT_PUBLIC_WORDPRESS_STORE_URL:-$LIVE_URL}"

cat <<EOF
CHATTANOOGA_API_SID=${CHATT_SID}
CHATTANOOGA_API_TOKEN=${CHATT_TOKEN}
API_SID=${CHATT_SID}
API_TOKEN=${CHATT_TOKEN}
CRON_SECRET=${CRON_SECRET}
NEXT_PUBLIC_LIVE_STORE_URL=${LIVE_URL}
NEXT_PUBLIC_WORDPRESS_STORE_URL=${WP_STORE}
NEXT_PUBLIC_SITE_URL=${PREVIEW_URL}
EOF
