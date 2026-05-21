# Sync production (Lightsail) → GitHub

When **modulargunworks.com** has the correct code and GitHub is behind:

```bash
cd ~/modulargunworksllc.github.io
bash wordpress-package/scripts/sync-live-to-repo.sh
git add wordpress-package/modulargunworks wordpress-package/plugins wordpress-package/mu-plugins
git status wordpress-package/
git commit -m "Sync production Lightsail theme, MGW plugins, and mu-plugins"
git push origin main
```

**Source paths on Bitnami (typical):**

| Production | Repo |
|------------|------|
| `/opt/bitnami/wordpress/wp-content/themes/modulargunworks/` | `wordpress-package/modulargunworks/` |
| `/opt/bitnami/wordpress/wp-content/plugins/mgw-*` | `wordpress-package/plugins/mgw-*` |
| `/opt/bitnami/wordpress/wp-content/mu-plugins/mgw-*.php` | `wordpress-package/mu-plugins/` |

**Not synced:** WordPress core, uploads, third-party plugins, secrets.

**Deploy direction (Git → live):** see [DEPLOY-FROM-GIT.md](./DEPLOY-FROM-GIT.md).
