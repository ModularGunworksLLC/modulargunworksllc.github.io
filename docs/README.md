# GitHub Pages (`/docs`)

This folder is the intended **GitHub Pages** publishing source for **`modulargunworksllc.github.io`** when you want a tiny stub at the GitHub hostname.

## Configure on GitHub

1. Repo **Settings → Pages**
2. **Build and deployment → Source:** Deploy from a branch
3. Branch: **`main`** / folder: **`/docs`**

## Contents

- **`index.html`** — Redirects visitors to the live WordPress store.

## Custom domain

The live site uses **www.modulargunworks.com** on Lightsail. The old [`CNAME`](../legacy/github-pages-static/CNAME) file is archived under `legacy/github-pages-static/`. If you use a custom domain on GitHub Pages again, add a new `CNAME` file **in this `docs/` folder** only if DNS should point at GitHub; otherwise leave DNS pointing at WordPress.
