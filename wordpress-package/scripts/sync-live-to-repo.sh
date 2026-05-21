#!/usr/bin/env bash
# Copy production Lightsail WordPress custom code INTO this repo (live is source of truth).
set -euo pipefail

REPO_DIR="${REPO_DIR:-$HOME/modulargunworksllc.github.io}"
WP_ROOT="${WP_ROOT:-/opt/bitnami/wordpress}"
WP_CONTENT="$WP_ROOT/wp-content"

if [[ ! -d "$WP_CONTENT/themes/modulargunworks" ]]; then
  echo "Live theme not found at $WP_CONTENT/themes/modulargunworks"
  exit 1
fi

PKG="$REPO_DIR/wordpress-package"
mkdir -p "$PKG/mu-plugins" "$PKG/plugins"

copy_tree() {
  local src="$1" dest="$2"
  if command -v rsync >/dev/null 2>&1; then
    mkdir -p "$dest"
    rsync -a --delete --exclude='*.bak' --exclude='*.bak-*' "$src/" "$dest/"
    return
  fi
  rm -rf "$dest"
  mkdir -p "$dest"
  (cd "$src" && tar --exclude='*.bak' --exclude='*.bak-*' -cf - .) | (cd "$dest" && tar xf -)
}

echo "==> Theme: live -> wordpress-package/modulargunworks"
copy_tree "$WP_CONTENT/themes/modulargunworks" "$PKG/modulargunworks"

echo "==> MGW plugins"
for d in mgw-chattanooga-sync mgw-crypto-polyfill mgw-populate-filter-attributes mgw-sales-tax mgw-image-count; do
  if [[ -d "$WP_CONTENT/plugins/$d" ]]; then
    copy_tree "$WP_CONTENT/plugins/$d" "$PKG/plugins/$d"
  fi
done

echo "==> MU plugins"
mkdir -p "$PKG/mu-plugins"
for f in "$WP_CONTENT/mu-plugins"/*.php; do
  [[ -f "$f" ]] || continue
  base="$(basename "$f")"
  [[ "$base" == *.bak* ]] && continue
  cp -a "$f" "$PKG/mu-plugins/$base"
done

echo "Done. Review with: cd $REPO_DIR && git status wordpress-package/"
