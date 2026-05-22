#!/usr/bin/env bash
# Pull all integration secrets from Lightsail WordPress into apps/store/.env.local
# Never commit .env.local — gitignored via .env*
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${1:-$ROOT/.env.local}"
WP_CONFIG="${WP_CONFIG:-/opt/bitnami/wordpress/wp-config.php}"
WP_PATH="${WP_PATH:-/opt/bitnami/wordpress}"
export WP_PATH

read_wp_define() {
  local name="$1"
  sudo grep -E "define\(\s*'${name}'" "$WP_CONFIG" 2>/dev/null \
    | head -1 \
    | sed -n "s/.*'${name}',\s*'\([^']*\)'.*/\1/p"
}

read_wp_bool_define() {
  local name="$1"
  local v
  v="$(sudo grep -E "define\(\s*'${name}'" "$WP_CONFIG" 2>/dev/null | head -1 || true)"
  if echo "$v" | grep -q ", true)"; then echo "true"; else echo "false"; fi
}

WP_HOME="$(read_wp_define WP_HOME)"
WP_HOME="${WP_HOME:-https://www.modulargunworks.com}"

if [[ -z "${CRON_SECRET:-}" ]]; then
  CRON_SECRET="$(openssl rand -hex 32)"
fi

{
  echo "# Auto-generated from WordPress on Lightsail — $(date -Iseconds)"
  echo "# Regenerate: apps/store/scripts/sync-env-from-wordpress.sh"
  echo ""
  echo "NEXT_PUBLIC_WORDPRESS_STORE_URL=${WP_HOME}"
  echo "NEXT_PUBLIC_LIVE_STORE_URL=${WP_HOME}"
  echo "NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL:-https://modulargunworksllc-github-io.vercel.app}"
  echo ""

  sid="$(read_wp_define MGW_CHATTANOOGA_API_SID)"
  tok="$(read_wp_define MGW_CHATTANOOGA_API_TOKEN)"
  if [[ -n "$sid" ]]; then
    echo "# Chattanooga Shooting API (mgw-chattanooga-sync / wp-config)"
    echo "CHATTANOOGA_API_SID=$sid"
    echo "API_SID=$sid"
  fi
  if [[ -n "$tok" ]]; then
    echo "CHATTANOOGA_API_TOKEN=$tok"
    echo "API_TOKEN=$tok"
  fi
  echo ""

  echo "# Ledger service-request intake (wp-config MGW_LEDGER_*)"
  echo "LEDGER_INTAKE_ENABLED=$(read_wp_bool_define MGW_LEDGER_INTAKE_ENABLED)"
  intake_url="$(read_wp_define MGW_LEDGER_INTAKE_URL)"
  intake_tok="$(read_wp_define MGW_LEDGER_INTAKE_TOKEN)"
  [[ -n "$intake_url" ]] && echo "LEDGER_INTAKE_URL=$intake_url"
  [[ -n "$intake_tok" ]] && echo "LEDGER_INTAKE_TOKEN=$intake_tok"
  echo ""

  echo "# Catalog sync cron auth"
  echo "CRON_SECRET=$CRON_SECRET"
  echo "CATALOG_SYNC_SECRET=$CRON_SECRET"
} > "$OUT"

python3 <<'PY' >> "$OUT"
import json, os, subprocess

WP_PATH = os.environ["WP_PATH"]

def wp_option(name):
    cmd = [
        "sudo", "/opt/bitnami/wp-cli/bin/wp", "option", "get", name,
        "--path=" + WP_PATH, "--format=json",
    ]
    try:
        out = subprocess.check_output(cmd, stderr=subprocess.DEVNULL, text=True)
        return json.loads(out) if out.strip() else None
    except Exception:
        return None

def emit(k, v):
    if v is None or str(v).strip() == "":
        return
    s = str(v).replace("\r", "").replace("\n", " ")
    if any(c in s for c in ' \t#"'):
        s = '"' + s.replace("\\", "\\\\").replace('"', '\\"') + '"'
    print(f"{k}={s}")

epx = wp_option("woocommerce_epx_settings")
if isinstance(epx, dict):
    print("\n# PaymentHub / EPX (woocommerce-gateway-epx)")
    emit("PAYMENTHUB_EPI_ID", epx.get("epi_id"))
    emit("PAYMENTHUB_EPI_KEY", epx.get("epi_key"))
    emit("PAYMENTHUB_TESTMODE", "true" if epx.get("testmode") == "yes" else "false")
    emit("PAYMENTHUB_ENABLED", epx.get("enabled"))

guntab = wp_option("woocommerce_guntab_settings")
if isinstance(guntab, dict):
    print("\n# GunTab payment gateway")
    test = guntab.get("testmode") == "yes"
    key = guntab.get("test_api_key") if test else guntab.get("prod_api_key")
    emit("GUNTAB_API_TOKEN", key)
    emit("GUNTAB_TESTMODE", "true" if test else "false")
    emit("GUNTAB_ENABLED", guntab.get("enabled"))

webhook = wp_option("guntab_webhook_key")
if webhook:
    emit("GUNTAB_WEBHOOK_KEY", webhook)

emit("GUNTAB_SELLER_EMAIL", "modulargunworks@gmail.com")
PY

chmod 600 "$OUT"
echo "Wrote $(grep -cE '^[A-Z]' "$OUT" 2>/dev/null || echo 0) env vars to $OUT"
grep -E '^[A-Z_]+=' "$OUT" | cut -d= -f1 | sort
