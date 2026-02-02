# Product Sync & Activation Guide

## Auto-update every 4 hours (GitHub Actions) — no action needed after setup

The repo has a workflow that runs **every 4 hours** on GitHub, pulls from the Chattanooga API, updates `data/products/mapped-products/*.json`, and pushes so your site stays current.

**One-time setup (you must do this):**

1. Open your repo on GitHub → **Settings** → **Secrets and variables** → **Actions**.
2. Click **New repository secret** and add:
   - **Name:** `CHATTANOOGA_SID`  
     **Value:** your Chattanooga API SID (same as `API_SID` in your local `.env`).
3. Click **New repository secret** again:
   - **Name:** `CHATTANOOGA_TOKEN`  
     **Value:** your Chattanooga API token (same as `API_TOKEN` in your local `.env`).
4. Push the latest code (including `.github/workflows/sync-products.yml`) to `main` if you haven’t already.

After that, the workflow runs automatically every 4 hours (UTC: 12a, 4a, 8a, 12p, 4p, 8p). You can also run it anytime: **Actions** → **Modular Gunworks — Product Sync** → **Run workflow**.

---

## Single-script sync (recommended for local runs)

**One script does everything:** pull from the wholesaler API → map to your categories → write shop JSON. No chain of files, so fewer errors and one place to run.

- **Run once:**  
  `npm run sync`  
  or: `node scripts/sync-products.js`

- **Run every 4 hours** (keeps stock and prices updated so you don’t sell out-of-stock):  
  `npm run sync:schedule`  
  or: `node scripts/sync-products.js --schedule`  
  Leave this running (e.g. in a separate terminal or as a background service). To use 6 hours instead of 4, edit `INTERVAL_HOURS` in `scripts/sync-products.js`.

**Requires:** `.env` with `API_SID` and `API_TOKEN`.  
**Uses:** `data/products/category-mapping-template-cleaned.json` (Chattanooga category → your categories).  
**Writes:** `data/products/mapped-products/*.json` (what your shop pages load). Nothing else is written by this script.

---

## What We Just Did

✅ **Improved Categorization with Whitelist Approach**
- **Ammunition**: Only 7 major brands (Federal, Remington, Hornady, Winchester, Blazer, Wolf, Fiocchi, PMC, Aguila, etc.)
- **Magazines**: Only known magazine brands (Magpul, ETS, Glock, SIG, etc.)
- **Optics**: Only quality optics brands (Vortex, Leupold, Bushnell, Zeiss, Trijicon, etc.)
- **Gun Parts**: Only premium AR/gun builders (Aero Precision, Magpul, Geissele, etc.)
- **Reloading**: Only established reloading equipment brands (RCBS, Lee, Lyman, Hornady, etc.)
- **Outdoors**: Only known outdoor/tactical brands (Benchmade, Spyderco, Gerber, etc.)

✅ **Product Filtering**
- Excludes all FFL-required firearms (actual guns)
- Excludes allocated/reserved products
- Excludes items with zero inventory
- Excludes products with no valid pricing

## How to Move Forward

### Step 1: Clear Old Data
Clear the `active.json` file to remove the old activated products, then run a fresh sync:

```bash
# Backup the current active.json (optional)
copy data/products/active.json data/products/active.json.backup

# Clear active.json to start fresh
# (Only keep the metadata, no actual products)
```

### Step 2: Run Fresh Sync
Run the sync script with the improved categorization:

```bash
# This will fetch all products from Chattanooga API
# Filter using the new whitelist logic
# Categorize into the 7 categories
# Save to JSON files
node scripts/sync-chattanooga-api.js
```

### Step 3: Use Admin Panel to Cherry-Pick Products
Go to `http://localhost:3000/admin.html` and:

1. **Log in** with your admin password
2. **Search/filter** for products by:
   - Category (Ammunition, Magazines, Optics, etc.)
   - Brand (Federal, Magpul, Vortex, etc.)
   - Caliber/Type
   - Price range
3. **Select only the products you want** to sell
4. **Activate them** by category

### Step 4: Push to Live Site
Once you've activated the products you want:

```bash
git add data/products/active.json
git commit -m "Activate curated product selection"
git push origin main
```

## Key Benefits of This Approach

✅ **Quality Control**: Only whitelisted brands, no generic junk
✅ **Clear Categories**: Ammunition stays in ammunition, not reloading components
✅ **Manual Curation**: You choose exactly what you want to sell
✅ **Scalable**: As your inventory grows, you add more brands to whitelist
✅ **Live Updates**: Products appear immediately when you activate them

## Product Count Expectations

After the new sync with whitelist filtering, you should have roughly:
- **Ammunition**: 2,000-4,000 finished cartridges (down from mixing in reloading)
- **Magazines**: 500-1,000 quality magazines
- **Optics**: 500-1,500 quality scopes/sights
- **Gun Parts**: 1,000-2,000 quality AR/accessory parts
- **Reloading**: 1,000-2,000 reloading components
- **Outdoors**: 500-1,000 outdoor/tactical gear
- **Total**: ~10,000-15,000 quality products (vs 48,000 with mixed garbage)

## Troubleshooting

**Q: Ammunition page shows reloading bullets?**
A: The sync script needs to re-run to apply the new whitelist logic

**Q: Missing a specific brand?**
A: Add it to the whitelist in `scripts/sync-chattanooga-api.js` and re-sync

**Q: Products not showing on live site?**
A: Make sure you've activated them in admin panel and pushed to GitHub
