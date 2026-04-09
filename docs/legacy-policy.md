# Legacy Static Code Policy

This repository is WordPress-first. The `legacy/github-pages-static/` tree is archived for reference and rollback only.

## Policy

1. **No new storefront features in `legacy/github-pages-static/`.**
2. Changes under `legacy/github-pages-static/` are allowed only for:
   - archival maintenance,
   - operational migration notes,
   - emergency compatibility patches explicitly approved by maintainers.
3. All customer-facing commerce behavior must be implemented in:
   - `wordpress-package/modulargunworks/` (theme), and/or
   - `wordpress-package/plugins/mgw-*` (custom plugins), and/or
   - WooCommerce/admin/plugin configuration on server.

## Enforcement

- CI workflow `legacy-guardrails.yml` fails PRs when non-doc files change under `legacy/github-pages-static/`.
- Repo docs and deployment checklists require Woo smoke tests before release.

## Migration note

Legacy static URLs are redirected to canonical Woo URLs by theme-level redirects and optional server-level 301 rules.
