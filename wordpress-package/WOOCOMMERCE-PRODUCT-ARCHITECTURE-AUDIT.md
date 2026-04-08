# WooCommerce Product Architecture Audit

**Goal:** Move from custom coding per product change to a standard, scalable retail structure (Ammo Depot–style) where dropping a CSV from any vendor yields correctly categorized, filterable products via standard WordPress hooks.

---

## 1. Data Normalization Layer

### Current State: Vendor-Specific Logic

| Vendor | Plugin | Data Flow | Custom Code |
|--------|--------|-----------|-------------|
| Chattanooga | mgw-chattanooga-sync | API → JSON → `get_chattanooga_csv.sh` → `/tmp/chattanooga_data.csv` | Hardcoded column names, single mapping file |
| Lipsey's | — | — | Not integrated |
| Zanders | — | — | Not integrated |

**Why Custom Code Exists:**
- Each vendor CSV has different column names (SKU vs Item Number, Quantity In Stock vs Qty, etc.)
- Category hierarchies differ (Chattanooga uses `Parts/Parts Kits`, `Ammunition|Handgun Ammunition`)
- Attribute source varies (Chattanooga has Manufacturer; some vendors embed caliber in description)
- Sync logic is vendor-specific in `class-mgw-sync.php` — no abstraction

### Proposed: Universal Normalizer Class

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     MGW_Universal_Product_Normalizer                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  Input:  Raw row (associative array from any CSV/API)                        │
│  Config: Vendor map file (JSON) defines column → standard field mapping      │
│  Output: Standardized product data structure                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Standard Output Schema (Canonical Fields):**
```json
{
  "sku": "1BAEP1090I",
  "name": "B5 Systems Quick Disconnect Endplate Black",
  "description": "<p>...",
  "price": "13.60",
  "stock": 1,
  "brand": "B5 Systems",
  "category_key": "Parts/Parts Kits",
  "image_url": "https://...",
  "upc": "",
  "attributes": {}
}
```

**Vendor Map File Structure (e.g., `chattanooga-map.json`):**
```json
{
  "vendor_id": "chattanooga",
  "columns": {
    "sku": ["SKU", "Item Number"],
    "name": ["Web Item Name", "Item Name", "Description"],
    "price": ["Price"],
    "stock": ["Quantity In Stock", "Quantity Available"],
    "brand": ["Manufacturer"],
    "category_key": ["Category"],
    "image_url": ["Image Location"],
    "description": ["Web Item Description"],
    "upc": ["UPC"]
  },
  "category_mapping_file": "category-mapping.json",
  "delimiter": ",",
  "encoding": "UTF-8"
}
```

**Class Interface:**
```php
class MGW_Universal_Product_Normalizer {
    public static function normalize(array $row, string $vendor_map_path): array;
    public static function get_supported_vendors(): array; // scans plugins/mgw-product-sync/maps/*.json
}
```

**Integration:** Sync plugins (Chattanooga, Lipsey's, Zanders) become thin wrappers:
1. Fetch/parse vendor-specific data (CSV, API, FTP)
2. For each row: `$normalized = MGW_Universal_Product_Normalizer::normalize($row, $map_path);`
3. Pass `$normalized` to shared `MGW_Product_Importer::import($normalized)`

---

## 2. Taxonomy & Category Mapping

### Current WooCommerce Category Tree (Live)

| Parent | Child Terms | Count (sample) |
|--------|-------------|-----------------|
| Ammunition (158) | handgun (393), rifle (394), rimfire (395), shotgun (396) | 723 products |
| Magazines (159) | handgun-magazines (476), rifle-magazines (477), shotgun-magazines (478) | 400 |
| Firearms (160) | handguns (479), rifles (481), shotguns (483), short-barreled-rifles | 2513 |
| Gun Parts (161) | barrels, grips, lowers, uppers, triggers, etc. (25+ subcats) | 740 |
| Gear, Optics, Reloading, Outdoors | (flat or subcats) | — |

### category-mapping.json vs. Reality

**Mapping file has:**
- `"Ammunition|Handgun Ammunition": { "top": "Ammunition", "sub": "Ammunition|Handgun Ammunition" }`
- `"Handgun Magazines": { "top": "Magazines", "sub": "Handgun Magazines" }`

**Sync uses only `map['top']`:**
```php
$slug = $this->top_to_slug($top_cat);  // ammunition, magazines, etc.
wp_set_object_terms($product->get_id(), [(int)$term->term_id], 'product_cat');
```

**Sync never uses `map['sub']`** — `sub_to_slug()` and `get_or_create_subcategory()` exist but are never called.

**Result:** Products get only top-level (e.g., `ammunition`), not `ammunition` + `handgun`. The Firearm Type filter (`product_cat`) has no subcategory terms to work with on ammo products.

### Proposed: Automated Parent → Child Assignment

**Logic:**
1. Lookup `$map = $mapping[$cat_key]`
2. Resolve parent term: `$parent = get_term_by('slug', top_to_slug($map['top']), 'product_cat')`
3. Resolve child slug: `$child_slug = sub_to_slug($map['top'], $map['sub'])`
4. If `$child_slug`: `$child = get_or_create_subcategory($parent, $child_slug)`
5. Assign terms: `wp_set_object_terms($product_id, [$parent->term_id, $child->term_id], 'product_cat')` (or just child if hierarchical)
6. For Gun Parts: `sub_to_slug()` uses last segment of pipe-separated sub (e.g., `Barrels|Chassis & Stocks` → `chassis-stocks`); create under gun-parts if not exists

**Category mapping enhancement:** Add explicit slug mapping for vendors that use different names:
```json
{
  "Handgun Magazines": {
    "top": "Magazines",
    "sub": "Handgun Magazines",
    "sub_slug": "handgun-magazines"
  }
}
```

**Fallback:** When `sub_to_slug()` returns null (e.g., generic Gear), assign only parent.

---

## 3. Attribute-Based Filtering

### Why Attributes Don't Populate Automatically

1. **Sync never calls attribute setters** — `set_ammo_attributes()`, `set_magazine_attributes()`, `set_product_brand_attribute()` exist in `class-mgw-sync.php` but are never invoked from `run_sync()`.
2. **Populate plugin is manual** — `mgw-populate-filter-attributes` backfills by parsing product names; must be run separately (Tools → Populate Filter Attributes).
3. **No save hook** — No `woocommerce_new_product` / `woocommerce_update_product` hook runs extraction; attributes are only set during sync (and sync doesn't set them).

### Filter Everything Configuration

- Uses taxonomies: `pa_caliber`, `pa_capacity`, `pa_bullet_type`, `pa_grain_weight`, `pa_brand`, `pa_steel_case`, `pa_subsonic`
- Category-specific filter sets via `mgw_filter_set_ids`
- Terms must exist on products for filters to show options and work

### Proposed: Regex Extraction + Save-Process Integration

**Centralize extraction in a single class** (reusable by sync and hooks):

```php
class MGW_Attribute_Extractor {
    // Standard patterns - unified from sync + populate plugin
    private const CALIBER_PATTERNS = [
        '.22 LR', '.22 Magnum', '.38 Special', '.357 Magnum', '.40 S&W', '.45 ACP',
        '9mm', '10mm', '.223', '.308', '.300 BLK', '.300 Blackout', '5.56', '7.62x39',
        '12 Gauge', '20 Gauge', '410', '.45-70', '6.5 Creedmoor', '6mm ARC', '7.62 NATO',
    ];
    private const CALIBER_REGEX = '/\d+\.\d+x\d+(?:mm)?/i';  // 7.62x39mm

    private const BULLET_MAP = [
        'FMJ' => ['FMJ', 'Full Metal Jacket'],
        'JHP' => ['JHP', 'Jacketed Hollow Point'],
        'HP' => ['Hollow Point', ' HP'],
        'Soft Point' => ['Soft Point', 'SP'],
        'BTHP' => ['BTHP', 'Boat Tail'],
        'Buckshot' => ['Buck', 'Buckshot'],
        'Slug' => ['Slug'],
    ];

    public static function extract_caliber(string $text): string;
    public static function extract_bullet_type(string $text): string;
    public static function extract_grain_weight(string $text): string;  // (\d+)\s*(?:gr|grain)
    public static function extract_capacity(string $text): string;      // (\d+)\s*(?:rd|rds|round|capacity|\/)
    public static function extract_round_count(string $text): int;      // 50/ct, 20 rounds, etc.
    public static function extract_steel_case(string $text): string;    // steel case
    public static function extract_subsonic(string $text): string;     // subsonic
    public static function extract_all(array $texts, string $top_category): array;
}
```

**Regex Patterns (Copy-Ready):**
```
Caliber:     Patterns array (see sync) + fallback /\d+\.\d+x\d+(?:mm)?/i
Bullet:      stripos check: FMJ, JHP, HP, Hollow Point, Soft Point, SP, BTHP, Buckshot, Slug
Grain:       /(\d+)\s*(?:gr|grain)/i  → $m[1] . 'gr'
Capacity:   /(\d+)\s*(?:rd|rds|round|rounds|capacity|\/)/i  → $m[1] . ' rd'
Round count: /(\d+)\s*(?:rd|rds|round|rounds)\s*(?:\/|$)/i | /(\d+)\s*RD\b/i | /(\d+)\s*\/\s*(?:ct|rd|box)/i | /\b(\d+)\s*\/\s*ct\b/i
Steel case:  /steel\s*(?:case|cased)?/i  → 'Yes'
Subsonic:    /subsonic/i  → 'Yes'
```

**Hook into WooCommerce save:**

```php
add_action('woocommerce_new_product', 'mgw_auto_populate_filter_attributes', 20, 2);
add_action('woocommerce_update_product', 'mgw_auto_populate_filter_attributes', 20, 2);

function mgw_auto_populate_filter_attributes($product_id, $product = null) {
    if (!$product) $product = wc_get_product($product_id);
    if (!$product) return;

    $name = $product->get_name();
    $terms = get_the_terms($product_id, 'product_cat');
    $top_slug = mgw_get_primary_category_slug($terms);

    $attrs = MGW_Attribute_Extractor::extract_all(
        [$name, $product->get_short_description()],
        $top_slug
    );

    foreach ($attrs as $taxonomy => $value) {
        if ($value) mgw_set_product_attribute_term($product, $taxonomy, $value);
    }

    // Brand: prefer meta (_brand, _manufacturer) over extraction
    $brand = $product->get_meta('_brand') ?: $product->get_meta('_manufacturer');
    if (!$brand) $brand = MGW_Attribute_Extractor::extract_brand($name);
    if ($brand) mgw_set_product_attribute_term($product, 'pa_brand', $brand);

    $product->save();
}
```

**Result:** Any product saved (manual create, import, API) gets attributes auto-populated. Filters "just work" without a separate backfill step.

---

## 4. Theme vs. Data

### Theme Overrides That Affect Product Display

| File | Override | Impact on Standard WooCommerce |
|------|----------|--------------------------------|
| `content-product.php` | `_chattanooga_image_url` meta for image | Uses vendor-specific meta; falls back to WC image. **Recommend:** Prefer `_product_image_url` (vendor-agnostic) or standard attachment. |
| `content-product.php` | `get_attribute('brand')` then `_brand` meta | Brand display — OK if `pa_brand` is used; theme also checks meta. **Recommend:** Use `$product->get_attribute('pa_brand')` only. |
| `content-product.php` | `_round_count` + `modulargunworks_parse_round_count()` | CPR display — good for ammo. Keep. |
| `content-product.php` | `modulargunworks_product_is_ffl_required()` | FFL badge — keep. |
| `functions.php` | `modulargunworks_output_chattanooga_product_image` | Single product image from `_chattanooga_image_url` | Vendor-specific. **Recommend:** `_product_image_url` or standard thumbnail. |
| `functions.php` | `modulargunworks_cart_item_thumbnail` | Cart uses `_chattanooga_image_url` | Same as above. |
| `functions.php` | `woocommerce_default_catalog_orderby_options` | Adds "Price per round" | Good — uses `_price_per_round` meta. Keep. |
| `functions.php` | `woocommerce_get_loop_display_mode` | Returns `'products'` | Hides subcategory boxes. Keep if desired. |
| `functions.php` | `template_include` (cart, checkout, brands) | Custom pages | Keep. |
| `functions.php` | `redirect_canonical` | Preserves filter params | Essential for Filter Everything. Keep. |
| `functions.php` | `pre_get_posts` | In-stock filter fix for variable products | Keep. |
| `functions.php` | `woocommerce_single_product_summary` | Replaces meta with `modulargunworks_product_info_block` | Custom block for SKU, brand, stock. **Check:** Ensure it uses standard attributes. |

### Recommendations

1. **Replace `_chattanooga_image_url` with `_product_image_url`** — Universal meta key; sync sets it from any vendor's image column.
2. **Use `pa_brand` exclusively** — Remove `_brand` / `_manufacturer` checks; sync and hooks populate `pa_brand`.
3. **Keep style/layout overrides** — Product card layout, CPR, FFL badge, age gate — no conflict with data layer.
4. **Avoid theme-level product logic** — Moving attribute extraction to a shared class + hooks keeps theme focused on presentation.

---

## 5. Multi-Vendor Roadmap

### Target Structure

```
plugins/
  mgw-product-sync/                    # Core sync framework
    mgw-product-sync.php                # Bootstrap, loads normalizer + importer
    includes/
      class-mgw-universal-normalizer.php
      class-mgw-product-importer.php    # Shared: create/update product from normalized data
      class-mgw-attribute-extractor.php # Shared: regex extraction
      class-mgw-category-resolver.php   # Parent>child from mapping
    maps/
      chattanooga-map.json
      lipsays-map.json                  # Add when ready
      zanders-map.json                  # Add when ready
    vendors/
      chattanooga/
        class-mgw-chattanooga-sync.php  # Fetches CSV, calls normalizer + importer
      lipsays/
        class-mgw-lipsays-sync.php
      zanders/
        class-mgw-zanders-sync.php
```

### Adding a New Vendor: Map-File-Only Approach

1. **Create `maps/lipsays-map.json`:**
```json
{
  "vendor_id": "lipsays",
  "columns": {
    "sku": ["SKU", "PartNumber"],
    "name": ["ProductName", "Description"],
    "price": ["Price"],
    "stock": ["QtyOnHand"],
    "brand": ["Manufacturer", "Brand"],
    "category_key": ["Category", "Department"],
    "image_url": ["ImageURL", "ThumbnailURL"]
  },
  "category_mapping_file": "category-mapping-lipsays.json",
  "delimiter": "\t",
  "encoding": "UTF-8"
}
```

2. **Create `category-mapping-lipsays.json`** — Maps Lipsey's category strings to `{ top, sub }` (same schema as Chattanooga).

3. **Create minimal vendor class:**
```php
class MGW_Lipsays_Sync {
    public function run_sync() {
        $csv_path = $this->fetch_or_receive_csv();  // FTP, API, upload
        $rows = $this->parse_csv(file_get_contents($csv_path));
        $map_path = MGW_PRODUCT_SYNC_PATH . 'maps/lipsays-map.json';
        $importer = MGW_Product_Importer::instance();
        foreach ($rows as $row) {
            $normalized = MGW_Universal_Product_Normalizer::normalize($row, $map_path);
            $importer->import($normalized);
        }
    }
}
```

4. **No changes to:** Normalizer, Importer, Attribute Extractor, Category Resolver, Filter Everything, theme.

### Standard WordPress Hooks Used

| Hook | Purpose |
|------|---------|
| `woocommerce_new_product` | Auto-populate attributes on create |
| `woocommerce_update_product` | Auto-populate attributes on update |
| `woocommerce_product_import_inserted_product_object` | If using WooCommerce CSV importer with custom column mapping |
| `mgw_product_normalized` | (Custom) Filter normalized data before import |
| `mgw_product_imported` | (Custom) After product saved — e.g., trigger image fetch |

---

## Summary: Action Plan

| # | Task | Effort |
|---|------|--------|
| 1 | Create `MGW_Universal_Product_Normalizer` + map file schema | Medium |
| 2 | Create `MGW_Product_Importer` (shared create/update from normalized data) | Medium |
| 3 | Create `MGW_Attribute_Extractor` (unify sync + populate regex) | Low |
| 4 | Add `woocommerce_new_product` / `woocommerce_update_product` hook for auto attributes | Low |
| 5 | Fix run_sync to use `sub_to_slug` + `get_or_create_subcategory` for Parent>Child | Low |
| 6 | Refactor Chattanooga sync to use Normalizer + Importer | Medium |
| 7 | Replace `_chattanooga_image_url` with `_product_image_url` in theme | Low |
| 8 | Document map-file format; create template for new vendors | Low |

**End state:** Drop a CSV from any vendor → add/update map file → run vendor sync. Products get correct categories, attributes, and filters with no new sync logic.
