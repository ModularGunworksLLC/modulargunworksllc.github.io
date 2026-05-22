#!/usr/bin/env bash
# Push store env vars to Vercel from Lightsail sources (wp-config + optional .env).
# Requires: VERCEL_TOKEN, project linked or VERCEL_PROJECT_ID
set -euo pipefail

WP_CONFIG="${WP_CONFIG:-/opt/bitnami/wordpress/wp-config.php}"
PROJECT="${VERCEL_PROJECT:-modulargunworksllc-github-io}"
PROJECT_ID="${VERCEL_PROJECT_ID:-prj_ZtdTPfs2kqb7B4qfaScHJse0djL8}"
TEAM="${VERCEL_TEAM:-modulargunworksllcs-projects}"
ENV_FILE="${ENV_FILE:-$HOME/.config/mgw/vercel-store.env}"

if [[ -z "${VERCEL_TOKEN:-}" ]]; then
  echo "ERROR: Set VERCEL_TOKEN (https://vercel.com/account/tokens) then re-run." >&2
  exit 1
fi

if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  set -a && source "$ENV_FILE" && set +a
else
  read_wp_define() {
    local name="$1"
    sudo grep -E "define\(\s*'${name}'" "$WP_CONFIG" 2>/dev/null \
      | head -1 \
      | sed -n "s/.*'${name}',\s*'\([^']*\)'.*/\1/p"
  }
  CHATTANOOGA_API_SID="$(read_wp_define MGW_CHATTANOOGA_API_SID)"
  CHATTANOOGA_API_TOKEN="$(read_wp_define MGW_CHATTANOOGA_API_TOKEN)"
  API_SID="$CHATTANOOGA_API_SID"
  API_TOKEN="$CHATTANOOGA_API_TOKEN"
  CRON_SECRET="${CRON_SECRET:-$(openssl rand -hex 32)}"
  NEXT_PUBLIC_LIVE_STORE_URL="${NEXT_PUBLIC_LIVE_STORE_URL:-https://www.modulargunworks.com}"
  NEXT_PUBLIC_SITE_URL="${NEXT_PUBLIC_SITE_URL:-https://modulargunworksllc-github-io.vercel.app}"
fi

CHATT_SID="${CHATTANOOGA_API_SID:-${API_SID:-}}"
CHATT_TOKEN="${CHATTANOOGA_API_TOKEN:-${API_TOKEN:-}}"

if [[ -z "$CHATT_SID" || -z "$CHATT_TOKEN" ]]; then
  echo "ERROR: Missing Chattanooga credentials. Run scripts/extract-store-env.sh first." >&2
  exit 1
fi

CRON_SECRET="${CRON_SECRET:-$(openssl rand -hex 32)}"
PREVIEW_URL="${NEXT_PUBLIC_SITE_URL:-https://modulargunworksllc-github-io.vercel.app}"
LIVE_URL="${NEXT_PUBLIC_LIVE_STORE_URL:-https://www.modulargunworks.com}"

api_url() {
  local id="${VERCEL_PROJECT_ID:-$PROJECT_ID}"
  if [[ -n "${VERCEL_TEAM_ID:-}" ]]; then
    echo "https://api.vercel.com/v10/projects/${id}/env?teamId=${VERCEL_TEAM_ID}"
  else
    echo "https://api.vercel.com/v10/projects/${id}/env?slug=${TEAM}"
  fi
}

upsert_env() {
  local key="$1"
  local value="$2"
  local targets="${3:-production,preview,development}"

  local url
  url="$(api_url)"

  # Remove existing key (ignore 404)
  curl -sS -X DELETE "${url}&key=${key}" \
    -H "Authorization: Bearer ${VERCEL_TOKEN}" >/dev/null 2>&1 || true

  local payload
  payload=$(jq -n \
    --arg key "$key" \
    --arg value "$value" \
    --arg targets "$targets" \
    '{
      key: $key,
      value: $value,
      type: "encrypted",
      target: ($targets | split(","))
    }')

  local status
  status=$(curl -sS -o /tmp/vercel-env-resp.json -w "%{http_code}" -X POST "$url" \
    -H "Authorization: Bearer ${VERCEL_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "$payload")

  if [[ "$status" != "200" && "$status" != "201" ]]; then
    echo "FAILED $key HTTP $status: $(cat /tmp/vercel-env-resp.json)" >&2
    return 1
  fi
  echo "OK $key"
}

echo "Pushing env to Vercel project: ${PROJECT} (team slug: ${TEAM})"

upsert_env "CHATTANOOGA_API_SID" "$CHATT_SID"
upsert_env "CHATTANOOGA_API_TOKEN" "$CHATT_TOKEN"
upsert_env "API_SID" "$CHATT_SID"
upsert_env "API_TOKEN" "$CHATT_TOKEN"
upsert_env "CRON_SECRET" "$CRON_SECRET"
upsert_env "NEXT_PUBLIC_LIVE_STORE_URL" "$LIVE_URL"
upsert_env "NEXT_PUBLIC_WORDPRESS_STORE_URL" "${NEXT_PUBLIC_WORDPRESS_STORE_URL:-$LIVE_URL}"
upsert_env "NEXT_PUBLIC_SITE_URL" "$PREVIEW_URL"

echo "Done. Redeploy production in Vercel so env vars apply."
