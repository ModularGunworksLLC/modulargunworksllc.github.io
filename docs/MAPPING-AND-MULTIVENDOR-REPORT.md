# Mapping & Multi-Vendor E‑commerce: Code Review and Recommendations

## 1. Yes — mapping can hold up products

### How a product gets on the live site today

A product appears on the site only if **all** of these are true at sync time:

1. **It has a mapping**  
   `map = mapping[catKey] || overrideMapping`.  
   - **Template:** Feed `Category` (e.g. `"Parts/Parts Kits"`) is normalized and looked up in `category-mapping-template-cleaned.json`. The key must match **exactly** (after HTML-entity normalization).  
   - **Override:** Admin saved a mapping for that SKU in overrides (Neon/file).  
   - If **neither** template nor override gives a mapping, `map` is null and the product is **never** written to any `mapped-products/*.json` file, so the live site never sees it.

2. **Not hidden**  
   Override `hidden !== true`.

3. **Has list price**  
   Override price, or MSRP, or MAP (never dealer).

So **mapping is a hard gate**: no mapping ⇒ no category file ⇒ product never loads on the site. That’s by design so only categorized products show, but it means:

- **Template holes:** Any feed category that isn’t in the mapping file (or doesn’t match the key exactly, e.g. extra spaces, different `|` usage) will leave all those products unmapped unless you fix the template or map them in admin.
- **Override-only path:** Products whose feed category isn’t in the template only get on the site if someone maps them in admin (and sync runs). So the template can “hold up” products until you add entries or use overrides.

You already have a script to find gaps: **`scripts/list-missing-categories.js`** — it compares feed categories to the mapping file and reports unmapped ones. Running it periodically (e.g. after a full sync) shows where mapping holes are and how many products they affect.

---

## 2. Current architecture: strengths and gaps

### What the code does well

- **Single mapping source:** One template file + overrides. Sync uses both; admin edits only overrides. Clear flow.
- **Override wins:** Per-SKU mapping (and hidden, price, image) override the template so you can fix or recategorize without editing the big JSON.
- **SKU consistency:** Admin and sync trim SKU when reading/writing overrides so lookup matches.
- **Pricing rule:** List price = override → MSRP → MAP everywhere (admin, sync, live site); dealer is never used as list price.
- **Vendor-specific raw feed:** Sync writes `data/vendors/chattanooga/all-products.json` so you keep a per-vendor snapshot.
- **Drop-ship data preserved:** `load-products.js` normalizer keeps `dropShip`, `dropShipPrice`, `availableDropShipOptions`; the live site *could* use them for UI or fulfillment (today it mainly displays products).

### Gaps / risks

- **Exact category key match:** Mapping keys must match the normalized feed category exactly. Variations (e.g. `"Parts / Parts Kits"` vs `"Parts/Parts Kits"`) or new categories from the vendor create “holes” until the template or overrides are updated.
- **No live API in admin:** Admin loads from `all-products.json` (and overrides). It doesn’t call the wholesaler API. So admin shows “what we last synced,” not real-time inventory/pricing from the vendor. Fine for a sync-based model, but something to be aware of if you add vendors with real-time API.
- **Single vendor in sync:** Sync is Chattanooga-only (API → feed URL → CSV). Adding another vendor (API or CSV) would require either separate sync scripts or a refactor to a vendor-agnostic pipeline.
- **Category file name from mapping “top”:** Sync writes files by `top` (e.g. `Gun Parts` → `Gun_Parts.json`). The live site’s `getCategoryFileName()` derives the file from the **page** (e.g. `gun-parts.html` → `Gun_Parts.json`). If you add a new `top` in mapping, you must add a matching shop page (or route) and ensure the name matches, or that category won’t have a page.
- **Search/brand/sale:** They each fetch multiple category JSON files (BRAND_CATEGORIES etc.). Adding a new category file requires updating those lists so search/brand/sale include it.

---

## 3. Recommendations for multi-vendor e‑commerce (API + CSV, drop-ship)

### A. Keep a single “storefront” layer

- **Do:** Keep one canonical place the live site reads from: your own **mapped product catalog** (e.g. `mapped-products/*.json` or a future DB/API that’s built from the same idea).  
- **Do not:** Have the storefront call each vendor’s API or CSV at request time. That would mix latency, auth, and format issues into the customer path.  
- So: **ingest** (sync/import) from each vendor into your own structures; **display** from your own data. Your current “sync writes JSON, site reads JSON” fits this.

### B. Normalize per-vendor feeds into one schema

- **Do:** Define one internal product schema (e.g. sku, name, description, listPrice, cost, category, subcategory, image, inventory, dropShip, vendorId).  
- **Do:** For each vendor (API or CSV), write a small **adapter** that maps their columns/fields into that schema (and optionally a “raw” blob for debugging).  
- **Do:** Store or merge by (vendorId, sku) so the same logical product from two vendors can be handled later (e.g. prefer one vendor, or merge inventory).  
- Today you effectively have one schema in `normalizeVendorProduct` and one vendor; adding a second vendor would mean a second adapter and a merge strategy (e.g. separate files per vendor vs one merged catalog).

### C. Mapping: template + overrides, and finding holes

- **Do:** Keep “template (feed category → your category) + overrides (per SKU).” That scales to multiple vendors if each feed has a category field you can map.  
- **Do:** Run `list-missing-categories.js` (or equivalent) per vendor after each full sync to see unmapped feed categories and product counts. Fix by either adding template entries or mapping in admin and re-syncing.  
- **Do:** Normalize category keys the same way in sync and in the missing-categories script (e.g. trim, HTML-decode) so “holes” are visible and fixable.  
- **Consider:** A “default” mapping (e.g. “Uncategorized” or “Other”) for feed categories that aren’t in the template, so new vendor categories don’t hide products until you’ve mapped them; you can then recategorize in admin.

### D. API vs CSV vendors

- **API vendors:**  
  - Prefer polling on a schedule (like your 4‑hour sync) to build your own product/inventory snapshot.  
  - Use the API for: feed URL, product list, inventory, and (if offered) real-time availability or drop-ship options.  
  - Cache the result in your DB or files; don’t call the API on every page load.

- **CSV vendors:**  
  - Same idea: run a job that downloads CSV (or uses an API that returns CSV), normalizes into your schema, applies mapping (template + overrides), and writes to your catalog (e.g. mapped-products or DB).  
  - Schedule the job (cron, scheduler, or `--schedule` like today) so the site always reads from your data.

So: both API and CSV feed **the same pipeline**: normalize → map → write to your catalog. Only the “fetch” step differs (API vs CSV URL).

### E. Drop-ship and fulfillment

- **Do:** Keep drop-ship flags and options in your normalized product (you already have `dropShip`, `dropShipPrice`, `availableDropShipOptions`).  
- **Do:** When you implement checkout/orders, pass that through so the right fulfillment path (in-house vs drop-ship) and vendor-specific options can be used.  
- **Do not:** Block “product loads on site” on drop-ship; mapping and list price should remain the gates. Drop-ship affects *how* you fulfill, not *whether* the product appears.

### F. Loading performance and structure

- **Do:** Keep category-based files (or DB views) so the site can load one category per page without parsing the whole catalog. Your current “one JSON per category page” is good.  
- **Do:** For search/brand/sale, loading several category files and merging in the browser is fine at moderate scale; if the catalog grows large, move to a backend search/aggregation that reads the same mapped data and returns IDs or a small payload.  
- **Do:** Ensure sync writes only what’s needed for the storefront (e.g. no huge raw HTML in the JSON if you can strip or truncate), so files stay small and fast to load.

---

## 4. Summary: what to do next

1. **Run `list-missing-categories.js`** after a full sync and fix mapping holes (add template entries or map in admin) so fewer products are held up by missing mapping.  
2. **Keep the current flow:** mapping (template + overrides) is the gate for “does this product load on the site”; that’s correct — just keep the template and overrides in sync with the feed.  
3. **When adding vendors:** add an ingest path (API or CSV) → normalize to your schema → same mapping + overrides → same `mapped-products` (or merged catalog). Don’t let the live site call vendor APIs directly.  
4. **Use drop-ship fields** for fulfillment logic when you build it; don’t tie “product visible” to drop-ship.  
5. **Document** which category keys in the template correspond to which shop pages and which files in BRAND_CATEGORIES / search / sale so new categories get wired end-to-end (mapping → file → page → nav).

This keeps your current design (mapping can hold up products until you fix holes) explicit and gives you a path to multi-vendor, API + CSV, and drop-ship without tying the storefront to live vendor APIs.
