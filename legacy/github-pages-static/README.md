# Archived GitHub Pages static site

This tree holds the **previous** user-site layout from the `modulargunworksllc.github.io` repository (HTML storefront, `shop/`, `scripts/`, `styles/`, `data/`, etc.). It is **not** the live store.

## Live site

The production store runs on **WordPress** (AWS Lightsail): [https://www.modulargunworks.com](https://www.modulargunworks.com).

## Source of truth

Custom theme, plugins, and deploy docs live under **[`wordpress-package/`](../../wordpress-package/)** on `main`.

## Git branch snapshot

A frozen pointer to **`origin/main` before the WordPress-first restructure** is kept as branch:

- **`archive/github-pages-static`** (created from `origin/main` at commit documented in the restructuring PR — e.g. `f7e4e0e` “Wordpress Package to REPO”).

Use `git checkout archive/github-pages-static` to browse the old default-branch layout without this `legacy/` folder.

## What moved here (2026-04-08)

- Root `*.html`, `shop/`, `scripts/`, `styles/`, `images/`, `data/`
- Static tooling: `serve.js`, `package.json`, `package-lock.json`, `Dockerfile`, `CNAME`, `favicon.png`
- Internal/reference Markdown files that accompanied the static era
- Original repo `docs/` content → `static-reference-docs/repo-docs-original/`

## GitHub Pages

If you still use GitHub Pages on this repository, set the **publishing source** to the **`/docs` folder** on `main` (see [`docs/README.md`](../../docs/README.md)). Do **not** publish from repository root, or `legacy/` files could be served unintentionally depending on your Pages configuration.
