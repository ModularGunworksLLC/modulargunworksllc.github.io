# Chattanooga Sync & Filter System — Architectural Audit

**Date:** March 4, 2026  
**Scope:** Product import pipeline, filtering logic, category mapping, database state

---

## 1. Data Source: CSV Parsing

### File
`plugins/mgw-chattanooga-sync/includes/class-mgw-sync.php`

### Parse Flow
- `parse_csv()` reads `/tmp/chattanooga_data.csv`
- First line = headers (used as row keys)
- `str_getcsv()` for each line, associative array per row

### CSV Columns (Actual)
```
SKU, Item Name, Quantity In Stock, Price, UPC, Web Item Name, Web Item Description,
Drop Ship Flag, Drop Ship Price, Category, Ship Weight, Image Location, Manufacturer,
Manufacturer Item Number, Length, Width, Height, MAP, MSRP, ...
```

### Column → WooCommerce Mapping (Current)

| CSV Column | WooCommerce Field | Used? |
|------------|-------------------|-------|
| SKU | `product->set_sku()` | ✅ |
| Web Item Name / Item Name / Description | `product->set_name()` | ✅ |
| Price | `product->set_regular_price()` | ✅ |
| Quantity In Stock | `product->set_stock_quantity()` | ✅ |
| Category | Category mapping → `product_cat` | ✅ |
| **Manufacturer** | — | ❌ **NOT USED** |
| **Image Location** | — | ❌ **NOT USED** |
| **Web Item Description** | — | ❌ **NOT USED** |
| **UPC** | — | ❌ **NOT USED** |

### Critical Gap
**No product attributes are set.** The sync only populates: SKU, name, price, stock, status, and top-level category.

---

## 2. Filtering Logic: Product Attributes

### How Filter Everything Works
- Filter Everything uses **taxonomy terms** on products
- Filters are bound to: `pa_caliber`, `pa_capacity`, `pa_bullet_type`, `pa_grain_weight`, `pa_brand`, `pa_steel_case`, `pa_subsonic`
- These are **WooCommerce Global Attributes** (created via `wc_create_attribute()`, registered as taxonomies)

### Attribute Generation in class-mgw-sync.php
The sync class **defines** these methods but **never calls them** from `run_sync()`:

| Method | Purpose | Called from run_sync? |
|--------|---------|----------------------|
| `set_ammo_attributes()` | pa_caliber, pa_bullet_type, pa_grain_weight, pa_steel_case, pa_subsonic, _round_count | ❌ NO |
| `set_magazine_attributes()` | pa_caliber, pa_capacity | ❌ NO |
| `set_product_brand_attribute()` | pa_brand (from Manufacturer) | ❌ NO |
| `set_product_attribute_term()` | Generic taxonomy term setter | ❌ NO |
| `set_product_image()` | Product thumbnail | ❌ NO |

### Current Workaround
- **mgw-populate-filter-attributes** plugin exists and is **active**
- It backfills attributes by **parsing product names** (extract_caliber, extract_capacity, etc.)
- Must be run **manually** from Tools → Populate Filter Attributes
- Does **not** use CSV `Manufacturer` — only parses name, and has no access to Manufacturer column

### Verdict
**Filters fail because products have no attribute terms.** The sync never writes `pa_caliber`, `pa_capacity`, etc. The populate plugin can backfill from names, but:
1. It’s a separate manual step
2. It doesn’t use Manufacturer from the CSV
3. Some products (e.g. Gun Parts) may need attributes the populate plugin doesn’t handle

---

## 3. Category Mapping

### File
`plugins/mgw-chattanooga-sync/includes/category-mapping.json`

### Structure
- Key = exact CSV `Category` value (e.g. `"Parts/Parts Kits"`, `"Ammunition|Handgun Ammunition"`)
- Value: `{ "top": "Gun Parts", "sub": "..." }`

### Current Logic in run_sync()
```php
$cat_key = $row['Category'] ?? '';
$map = $mapping[$cat_key] ?? null;

if (!$map) {
    $top_cat = "New Arrivals";
    $slug = "new-arrivals";
} else {
    $top_cat = $map['top'];
    $slug = $this->top_to_slug($top_cat);
}
wp_set_object_terms($product->get_id(), [(int)$term->term_id], 'product_cat');
```

### What’s Used vs. Ignored
- ✅ `map['top']` → top-level category slug (ammunition, magazines, gun-parts, etc.)
- ❌ `map['sub']` → **never used**  
- `sub_to_slug()` and `get_or_create_subcategory()` exist but are **never called** from `run_sync()`

### New Arrivals Fallback
- When `$mapping[$cat_key]` is null (unknown CSV category), products go to `new-arrivals`
- Requires the `new-arrivals` product_cat term to exist

### Verdict
- Top-level mapping works
- Subcategories (Handgun/Rifle/Rimfire/Shotgun under Ammunition, etc.) are **not applied**
- New Arrivals fallback works when the term exists

---

## 4. Database State

### wp_options (mgw_chattanooga_*)

| Option | Value |
|--------|-------|
| `mgw_chattanooga_batch_offset` | **2525** |
| `mgw_chattanooga_last_sync` | 2026-03-03 21:55:57 |
| `mgw_chattanooga_last_status` | Batch Done. Processed up to row 2525. Created: 16, Updated: 484 |
| `mgw_chattanooga_api_sid` | (set) |
| `mgw_chattanooga_api_token` | (set) |
| `mgw_chattanooga_batch_delay_min` | 30 |
| `mgw_chattanooga_batch_size` | 100 |
| `mgw_chattanooga_chain_enabled` | 1 |

### Observations
- No error strings in status
- CSV has **81,981 rows**; offset **2,525** → ~3% processed
- Import loop is functioning

---

## 5. Why 32,000 Products Don’t Show With Working Filters

### Root Causes (Prioritized)

#### A. **Missing Attribute Population (Primary)**
- `run_sync()` never calls `set_ammo_attributes()`, `set_magazine_attributes()`, or `set_product_brand_attribute()`
- Filter Everything depends on `pa_caliber`, `pa_capacity`, `pa_bullet_type`, `pa_brand`, etc.
- Without those terms, filter dropdowns are empty or ineffective

#### B. **Taxonomy Indexing**
- WooCommerce attribute taxonomies are created on first use by `set_product_attribute_term()`
- That code path is never hit by the sync, so:
  - Terms may not exist
  - `wc_product_meta_lookup` / term relationships are not populated for new products from the sync

#### C. **Import Loop vs. Attribute Backfill**
- Sync runs in 500-row batches
- `mgw-populate-filter-attributes` must be run **separately** to backfill attributes
- It parses product names; it does **not** use:
  - CSV `Manufacturer` (brand)
  - CSV category for category-specific logic

#### D. **Subcategories Not Assigned**
- Products get only top-level categories (e.g. ammunition, magazines)
- Subcategories (handgun, rifle, rimfire, shotgun) are not set
- Filter Everything’s “Firearm Type” filter uses `product_cat`; missing subcategory terms can reduce its usefulness

---

## 6. The “Un-Fuck” Plan

### Phase 1: Fix run_sync() to Set Attributes

1. **Call category-aware attribute setters** after `$product->save()`:

   ```php
   $name = $row['Web Item Name'] ?? $row['Item Name'] ?? ...;
   $top_slug = /* from mapping */;

   if (in_array($top_slug, ['ammunition'], true)) {
       $this->set_ammo_attributes($product, $name);
   } elseif (in_array($top_slug, ['magazines'], true)) {
       $this->set_magazine_attributes($product, $name);
   }

   $brand = $row['Manufacturer'] ?? '';
   if ($brand) {
       $this->set_product_brand_attribute($product, $brand);
   }
   ```

2. **Use `Manufacturer`** from the CSV for `pa_brand` instead of parsing it from the name.

3. **Optional:** Call `set_product_image()` when `Image Location` is present (if desired for images).

### Phase 2: Subcategories

- Add logic to use `map['sub']` and `sub_to_slug()` / `get_or_create_subcategory()`
- Assign both parent and child `product_cat` terms where applicable

### Phase 3: Backfill Existing Products

- Run **Populate Filter Attributes** (Tools → Populate Filter Attributes) for already-imported products
- Or add a WP-CLI command to the sync plugin that runs the same attribute logic over all products in batches

### Phase 4: Validate

- Re-run a small sync batch and confirm:
  - `pa_caliber`, `pa_capacity`, `pa_brand` are set where expected
  - Filter Everything shows values and filters products correctly

---

## Summary Table

| Component | Status | Action |
|-----------|--------|--------|
| CSV parsing | ✅ Works | — |
| Column mapping (SKU, name, price, stock) | ✅ Works | — |
| Category (top-level) | ✅ Works | — |
| **Product attributes** | ❌ Never set | Add attribute calls in run_sync() |
| **Brand (Manufacturer)** | ❌ Not used | Use Manufacturer column in run_sync() |
| Subcategories | ❌ Ignored | Use sub_to_slug + get_or_create_subcategory |
| Images | ❌ Not imported | Optional: add set_product_image() |
| Filter Everything config | ✅ Exists | — |
| mgw-populate-filter-attributes | ✅ Active | Run manually or automate; consider enhancing with Manufacturer |
