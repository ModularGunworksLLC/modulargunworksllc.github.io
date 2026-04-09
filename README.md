# Modular Gun Works — WordPress source (GitHub)

This repository is the **version-controlled source** for the **custom WordPress theme and Modular Gun Works (MGW) plugins** used on **AWS Lightsail**. The live storefront is **[modulargunworks.com](https://www.modulargunworks.com)**.

## Where everything lives

| Path | Purpose |
|------|---------|
| **[`wordpress-package/modulargunworks/`](wordpress-package/modulargunworks/)** | Active **`modulargunworks` theme** — copy to `wp-content/themes/modulargunworks/` on the server. |
| **[`wordpress-package/plugins/`](wordpress-package/plugins/)** | **Custom plugins** (`mgw-*`) — copy to `wp-content/plugins/`. |
| **[`wordpress-package/*.md`](wordpress-package/)** + scripts | Deploy notes, audits, one-off maintenance PHP/SH scripts. |
| **[`legacy/github-pages-static/`](legacy/github-pages-static/)** | **Archived** pre-WordPress GitHub Pages HTML site (not deployed from `main` root). |
| **[`docs/`](docs/)** | **GitHub Pages stub** only (redirect to the live site). Configure Pages to use **`/docs`** on **`main`**. |

## Quick links

- Deploy from Git: [`wordpress-package/DEPLOY-FROM-GIT.md`](wordpress-package/DEPLOY-FROM-GIT.md)
- Cart/checkout/GunTab fix doc: [`wordpress-package/DEPLOY-EVERYTHING.md`](wordpress-package/DEPLOY-EVERYTHING.md)
- Lightsail baseline: [`wordpress-package/setup-on-lightsail.sh`](wordpress-package/setup-on-lightsail.sh)
- Inventory snapshot: [`wordpress-package/INVENTORY-DIFF.md`](wordpress-package/INVENTORY-DIFF.md)
- Production plugin reference: [`wordpress-package/RUNTIME-STACK.md`](wordpress-package/RUNTIME-STACK.md)

## What is *not* in this repo

- WordPress core, `wp-config.php` secrets, database dumps  
- `wp-content/uploads/`  
- Third-party plugins (WooCommerce, Breeze, etc.) — install and upgrade on the server; versions are summarized in **RUNTIME-STACK.md**

## Archived static site (no new features)

The old default-branch HTML storefront is preserved in **`legacy/github-pages-static/`** and on Git branch **`archive/github-pages-static`** (snapshot of `origin/main` before the WordPress-first layout). See [`legacy/github-pages-static/README.md`](legacy/github-pages-static/README.md).

**Policy:** do not add new storefront features under `legacy/github-pages-static/`. Use WordPress theme/plugin code under `wordpress-package/` for all production behavior.

## Push from this clone (Lightsail)

This repo’s `origin` uses the SSH host alias **`github-modulargunworks`** (see `~/.ssh/config`) with a **deploy key** at `~/.ssh/modulargunworks_github`. On GitHub: **Repo → Settings → Deploy keys → Add deploy key**, paste the contents of **`~/.ssh/modulargunworks_github.pub`**, and enable **Allow write access**. Then:

```bash
cd ~/modulargunworksllc.github.io
git push origin main
git push origin archive/github-pages-static
```

If you use HTTPS instead, set `origin` back to  
`https://github.com/ModularGunworksLLC/modulargunworksllc.github.io.git` and authenticate with a **personal access token** (classic: `repo` scope).

## Workflow

1. Change theme/plugins **here**, commit, push `main`.  
2. Deploy to Lightsail per **DEPLOY-FROM-GIT.md** (hotfixes on the server should be **back-ported** here the same day).  
3. Purge caching (Breeze or CDN) after deploy when templates or assets change.
