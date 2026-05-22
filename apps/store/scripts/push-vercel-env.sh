#!/usr/bin/env bash
# Push apps/store/.env.local to Vercel project (requires VERCEL_TOKEN).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT/.env.local}"
PROJECT_ID="${VERCEL_PROJECT_ID:-prj_ZtdTPfs2kqb7B4qfaScHJse0djL8}"
TEAM="${VERCEL_TEAM:-modulargunworksllcs-projects}"

if [[ -z "${VERCEL_TOKEN:-}" ]]; then
  echo "ERROR: export VERCEL_TOKEN from https://vercel.com/account/tokens" >&2
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Run sync-env-from-wordpress.sh first to create $ENV_FILE" >&2
  exit 1
fi

command -v jq >/dev/null || { echo "jq required"; exit 1; }

api_base() {
  if [[ -n "${VERCEL_TEAM_ID:-}" ]]; then
    echo "https://api.vercel.com/v10/projects/${PROJECT_ID}/env?teamId=${VERCEL_TEAM_ID}"
  else
    echo "https://api.vercel.com/v10/projects/${PROJECT_ID}/env?slug=${TEAM}"
  fi
}

upsert_env() {
  local key="$1"
  local value="$2"
  local url
  url="$(api_base)"

  curl -sS -X DELETE "${url}&key=${key}" \
    -H "Authorization: Bearer ${VERCEL_TOKEN}" >/dev/null 2>&1 || true

  local payload
  payload=$(jq -n \
    --arg key "$key" \
    --arg value "$value" \
    '{
      key: $key,
      value: $value,
      type: "encrypted",
      target: ["production", "preview", "development"]
    }')

  local status
  status=$(curl -sS -o /tmp/vercel-env-resp.json -w "%{http_code}" -X POST "$url" \
    -H "Authorization: Bearer ${VERCEL_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "$payload")

  if [[ "$status" != "200" && "$status" != "201" ]]; then
    echo "FAILED $key HTTP $status" >&2
    cat /tmp/vercel-env-resp.json >&2
    return 1
  fi
  echo "OK $key"
}

echo "Pushing from $ENV_FILE to Vercel project $PROJECT_ID"

while IFS= read -r line || [[ -n "$line" ]]; do
  line="${line%%#*}"
  line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
  [[ -z "$line" ]] && continue
  [[ "$line" != *"="* ]] && continue
  key="${line%%=*}"
  value="${line#*=}"
  value="${value%\"}"
  value="${value#\"}"
  [[ -z "$value" ]] && continue
  upsert_env "$key" "$value"
done < "$ENV_FILE"

echo "Done. Redeploy production on Vercel."
