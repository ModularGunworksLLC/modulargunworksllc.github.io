# Product Catalog Admin

Multi-source product catalog admin: companies (CSV or API), primary listing, overrides, merge to master.

## Run locally

```bash
cd admin
npm install
npm start
```

Open http://localhost:3000 (or the port shown).

## Deploy to Render

1. New **Web Service**, connect this repo.
2. **Root Directory:** `admin`
3. **Build Command:** `npm install`
4. **Start Command:** `npm start`
5. Set env vars in Render (e.g. `GITHUB_TOKEN`, `ADMIN_PASSWORD`) when ready.

## Branch

Develop on `feature/admin`; merge to `main` when ready.
