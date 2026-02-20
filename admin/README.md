# Admin (product management)

Runs on the **feature/admin-page** branch. Does not change the main site or the GitHub Actions sync.

## Run locally

From the repo root:

```bash
npm run admin
```

Then open **http://localhost:3001**.

- **Login:** Use the password set in `.env` as `ADMIN_PASSWORD`, or default `admin` if not set.
- **Products:** Loaded from `data/products/mapped-products/*.json` (same data the site uses).
- **Overrides:** Stored in `data/products/overrides.json`. You can set per-product:
  - Override price (your custom price)
  - Hide on site
  - Always show on site

Edits are saved to `overrides.json` only. The live site and the 4-hour sync are unchanged until you later wire "push to site" (see docs).
