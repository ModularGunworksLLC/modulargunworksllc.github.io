# API Scripts, Category Mapping & What You Can Delete

## What You’re Doing (and what’s in place)

1. **Pull products from Chattanooga (wholesaler)**  
   You use their API and product feed. Your scripts already:
   - Call the Chattanooga REST API (with `API_SID` and `API_TOKEN` from `.env`).
   - Download the **product feed CSV** (all products, including **Image Location** per row).
   - Optionally fetch `/items` JSON and item properties.

2. **Get all product data including image URL**  
   - The **CSV** has everything you need: SKU, Item Name, Price, Category, **Image Location**, etc.
   - **Fix applied:** Product mapping now uses the CSV **"Image Location"** column for each row instead of a separate image file, so product images should show correctly after you re-run the mapping (see below).

3. **Map Chattanooga categories → your categories**  
   - **Chattanooga** has many categories (e.g. "Chassis & Stocks", "Ammunition|Handgun Ammunition").
   - **You** use top-level categories that become both:
     - JSON files in `data/products/mapped-products/` (e.g. `Ammunition.json`, `Gear.json`).
     - Shop pages in `shop/` (e.g. `ammunition.html`, `gear.html`).
   - The mapping file is **`data/products/category-mapping-template-cleaned.json`**.  
   Each key is a Chattanooga category; each value is `{ "top": "YourCategory", "sub": "..." }`.  
   Only categories present in this file are included in your mapped JSON files.

---

## Single-script pipeline (recommended)

**One script does everything:** API → product feed CSV → category mapping → shop JSON. No chain of files.

```bash
# Run once
npm run sync

# Run every 4 hours (keeps stock/prices updated)
npm run sync:schedule
```

- **Script:** `scripts/sync-products.js`
- **Reads:** `.env` (API_SID, API_TOKEN), `data/products/category-mapping-template-cleaned.json`
- **Writes:** only `data/products/mapped-products/*.json` (e.g. `Ammunition.json`, `Gear.json`)
- **Schedule:** `--schedule` runs once immediately, then every 4 hours. Change `INTERVAL_HOURS` in the script to 6 if you prefer.

Shop pages load these JSON files via `scripts/load-products.js`. No intermediate CSV or image files are written by this script.

---

## Your categories vs shop pages

| Mapped top-level (JSON file) | Shop page        | Notes |
|-----------------------------|------------------|--------|
| Ammunition                  | ammunition.html  | ✓      |
| Firearms                    | guns.html        | ✓      |
| Gear                        | gear.html        | ✓      |
| Gun_Parts                   | gun-parts.html   | ✓      |
| Knives                      | —                | No page yet; add `shop/knives.html` if you want it. |
| Optics                      | optics.html      | ✓      |
| Outdoors                    | outdoors.html    | ✓      |
| Reloading                   | reloading.html   | ✓      |
| Clothing___Footwear         | —                | No page; add e.g. `shop/clothing.html` if you want it. |
| **Magazines**               | magazines.html   | **Magazines.json** is not in mapped-products. To fix: add a top-level "Magazines" in the mapping and map the right Chattanooga categories to `"top": "Magazines"`, then re-run the CSV mapping so `Magazines.json` is created. |

So: **category mapping is correct** when every shop page you use has a matching top-level category in the mapping and that category gets written to a `.json` file (e.g. Magazines → `Magazines.json`).

---

## What you can delete without hurting design/layout

Your **header and footer** are in each HTML file (not a shared include). Deleting the following does **not** affect your header, footer, or page layout.

| File | Safe to delete? | Reason |
|------|-----------------|--------|
| **scripts/scrape-retailer-categories.js** | **Yes** | One-off scraper for PSA/Ammo Depot categories. Not used in your sync or mapping. |
| **scripts/extract-categories-images.js** | **Optional** | Only used to build `chattanooga-categories.json` and `chattanooga-images.json`. The mapper no longer uses `chattanooga-images.json`; images come from the CSV. You can delete this script if you don’t care about keeping a separate list of unique categories/images. |
| **clean-mapping.js** (root) | **Optional** | One-off: turns `category-mapping-template.json` into `category-mapping-template-cleaned.json`. Keep only if you still edit the template and re-clean it; otherwise safe to delete. |
| **automate-product-mapping.js** (root) | **Optional** | Maps from **API items JSON** (`chattanooga-items.json`) to mapped-products. Your site uses the **CSV-based** pipeline (automate-csv-product-mapping.js). You can delete this if you only ever use the CSV path. |

**Do not delete:**  
- `scripts/sync-chattanooga-api.js` (API + CSV download)  
- `automate-csv-product-mapping.js` (CSV → your categories + image URL)  
- `data/products/category-mapping-template-cleaned.json` (category mapping)  
- `scripts/load-products.js`, `scripts/shop-products-ui.js` (shop UI)  
- Any HTML/CSS that define your header, footer, or theme.

---

## Adding more categories and pages

If you want **new categories** (e.g. Magazines, Knives, Clothing):

1. **Mapping**  
   In `data/products/category-mapping-template-cleaned.json`, map Chattanooga categories to a new top-level, e.g.  
   `"Some Chattanooga Category": { "top": "Magazines", "sub": "..." }`.  
   Top-level name will become the JSON filename (e.g. `Magazines` → `Magazines.json`).

2. **New shop page**  
   Copy an existing shop page (e.g. `shop/gear.html`) to a new file (e.g. `shop/magazines.html` or `shop/knives.html`). Then:
   - Update `<title>`, meta description, and any page-specific text.
   - Keep the same header, footer, and CSS/script links so the theme matches.
   - The existing `load-products.js` will load the correct JSON based on the page filename (e.g. `magazines.html` → `Magazines.json`).

3. **Nav**  
   Add a link to the new page in the `category-nav` section on the pages where you want it (e.g. in `index.html` and in each shop page’s header).

4. **Re-run mapping**  
   Run `node automate-csv-product-mapping.js` again so the new category’s JSON file is generated.

---

## Quick checklist

- [ ] **API creds** in `.env`: `API_SID`, `API_TOKEN`
- [ ] **Sync:** `node scripts/sync-chattanooga-api.js` (gets latest CSV with Image Location)
- [ ] **Map:** `node automate-csv-product-mapping.js` (builds mapped-products with images)
- [ ] **Magazines:** If you use `magazines.html`, add "Magazines" to the mapping and re-run the CSV mapper so `Magazines.json` exists.
- [ ] **New categories/pages:** Add mapping entries, copy a shop page, add nav link, re-run CSV mapping.

If you tell me which new categories you want (e.g. Magazines, Knives), I can suggest exact mapping entries and filenames.
