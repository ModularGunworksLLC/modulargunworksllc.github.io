# Chattanooga Feed Format and Category Mapping

## How Chattanooga “API” data gets to you

Chattanooga does **not** give you a single JSON API of products. The flow is:

1. **API call:** `GET https://api.chattanoogashooting.com/rest/v5/items/product-feed` (with your Basic auth).
2. **Response:** JSON with a **product_feed.url** — a temporary URL to download a **CSV file**.
3. **Sync script** downloads that CSV and parses it with `csv-parser`. Each row becomes an object with column headers as keys.

So the “format” you work with is **CSV columns**. After sync, that data is stored as JSON (e.g. `data/vendors/chattanooga/all-products.json`) where each product is an object with keys like:

| Field | Example | Notes |
|-------|---------|--------|
| **SKU** | `1BAEP1090I` | Primary id |
| **Item Name** | END PLATE - BLK - STEEL | Internal name |
| **Web Item Name** | B5 Systems Quick Disconnect Endplate Black | Display name |
| **Category** | `Parts/Parts Kits` or `Gun Holsters\|Magazine Holsters` | **This is what mapping uses** |
| **Quantity In Stock** | 4 | Used for in-stock filtering |
| **Price** | 12.51 | Dealer cost (not shown as list price) |
| **MSRP**, **MAP** | 13.60 | List price sources (MAP used when no MSRP) |
| **Image Location** | https://media.chattanoogashooting.com/... | CDN URL |
| **Manufacturer**, **UPC**, **Drop Ship Flag**, etc. | | Other fields passed through |

**Important:** The **Category** value in the feed can be:

- A single segment: `Handguards`, `Slides`, `Paper Targets`
- A path with **pipes**: `Gun Holsters|Magazine Holsters`, `Non Cellular Trail Cameras|Hunting`
- A path with **slashes**: `Parts/Parts Kits` (less common in your feed)
- Multiple levels: `Airguns|Air Gun Accessories|Airgun Rifles`

Mapping keys must match the **exact** Category string after normalization (see below).

---

## Your site categories (where products end up)

The **live site** only shows products that land in one of these category files. Each file is named from the mapping **top** value with non-alphanumeric characters replaced by `_`:

| Mapping `top` | File name | Shop page / slug |
|--------------|-----------|-------------------|
| Ammunition | Ammunition.json | ammunition |
| Magazines | Magazines.json | magazines |
| Gun Parts | Gun_Parts.json | gun-parts |
| Gear | Gear.json | gear |
| Optics | Optics.json | optics |
| Reloading | Reloading.json | reloading |
| Outdoors | Outdoors.json | outdoors |
| Firearms | Firearms.json | guns |
| Knives | Knives.json | knives |
| Clothing & Footwear | Clothing___Footwear.json | clothing___footwear |

So every product must map to one of these **top** values, or it never gets written to any category file and never appears on the site.

---

## How mapping works (and why it “fails”)

### 1. Template file

- **File:** `data/products/category-mapping-template-cleaned.json`
- **Structure:** `{ "Feed Category Key": { "top": "Site Category", "sub": "Subcategory" }, ... }`
- **Key:** Must match the feed’s **Category** value **exactly** after normalization.

### 2. Normalization (sync and list-missing-categories)

Before lookup, the sync script normalizes the feed Category string:

- `&amp;` → `&`
- `&quot;` → `"`
- `&#39;` → `'`
- `&lt;` → `<`
- `&gt;` → `>`

So if the feed sends `Chassis &amp; Stocks`, the key in the mapping must be `Chassis & Stocks`. No extra spaces or different punctuation.

### 3. Lookup

- Sync: `map = mapping[normalizeCategoryKey(row['Category'])] || overrideMapping`
- If there is **no** template key and **no** admin override for that SKU, `map` is null and the product is **not** added to any category file (so it never appears on the site).

### 4. Why products stay unmapped

**A. Missing template keys (real categories)**  
The feed uses category paths that don’t exist in the template yet, e.g.:

- `Gun Holsters|Magazine Holsters` (we had `Magazine Holsters` and `Gun Holsters` but not this combined path)
- `Non Cellular Trail Cameras|Hunting`
- `Gun Parts|Slides`
- `Airguns|Air Gun Accessories|Airgun Rifles`
- `Shooting|Gun Cleaning Mats`, `Shooting|Trigger Pull Gauges`, `Firearms|Charging Handles/Bolt Knobs`, etc.

**Fix:** Add an entry for that exact normalized string and point it at the right `top` (and optional `sub`). Several of these have been added to the template so more products map.

**B. Garbage / malformed Category values**  
In the feed, some rows have invalid or non-category data in the Category column (e.g. numeric IDs like `49332`, model numbers like `SPC10`, or even CSV/HTML pasted into the field). Those will never match a sensible key.

**Fix:** Either ignore those rows (they stay unmapped) or ask the vendor to fix the feed. Do not add mapping keys for random numbers or product names.

**C. Admin override**  
If a product’s feed category is unmapped, you can still map it in the admin (Chattanooga tab): set a category for that SKU. Sync uses overrides when the template has no key.

---

## Finding mapping gaps

1. **From existing vendor JSON (no API call):**  
   `node scripts/analyze-feed-vs-mapping.js`  
   Reads `data/vendors/chattanooga/all-products.json`, collects unique normalized Category values, and reports:
   - How many products are mapped vs unmapped
   - Top unmapped category names by product count

2. **From live API (when not rate-limited):**  
   `node scripts/list-missing-categories.js`  
   Fetches the current feed from Chattanooga and does the same comparison. Writes `data/products/missing-categories-report.json`.

3. **In the admin:**  
   Use the “Unmapped only” filter on the Chattanooga tab to see products that have no mapping (template or override). Mapping those in admin fixes them for the next sync.

---

## Summary

| What | Where |
|------|--------|
| **Chattanooga “API”** | Returns a URL; you download a **CSV**. Columns become JSON keys. |
| **Category field** | Feed column **Category**; can be single word or path with `\|` or `/`. |
| **Mapping keys** | Must match **normalized** Category **exactly** (including pipes and hierarchy). |
| **Site categories** | The 10 **top** values (Ammunition, Gun Parts, Gear, Optics, …) → one JSON file each → one shop area. |
| **Mapping issues** | (1) Real feed paths missing from template → add keys. (2) Garbage in Category → leave unmapped or fix at source. (3) Use admin override for one-off SKUs. |

After adding the new template entries, run sync again so the newly mapped categories are written to the category JSON files. Re-run `analyze-feed-vs-mapping.js` to see how many unmapped products remain (many of the rest will be garbage Category values).
