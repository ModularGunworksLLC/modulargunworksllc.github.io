# How Your Site Filters Products — Descriptive Summary

---

## Overview

Your WooCommerce store uses a **dual-layer filtering system**: the **Filter Everything** plugin as the primary engine, with a **custom fallback** (`MGW_Shop_Filters`) when Filter Everything has no active filter set for the current page. Both rely on **WooCommerce Global Attributes** (taxonomies like `pa_caliber`, `pa_brand`) assigned to products.

---

## 1. The Filter Flow (Page Load → Results)

### Step 1: User lands on a shop page

When someone visits **Shop**, **Ammunition**, **Magazines**, **Firearms**, or a **Brand** archive:

1. WordPress loads the main product query.
2. The theme’s `archive-product.php` (or `taxonomy-pa_brand.php`) includes `sidebar-shop-filters.php`.
3. `sidebar-shop-filters.php` checks: *Does Filter Everything have a filter set for this page?*

### Step 2: Choosing the filter set

**Filter Everything** decides which filter set to show via its own hooks:

- `wpc_relevant_set_ids` — Filter Everything asks: “Which filter set(s) should appear?”
- `modulargunworks_filter_relevant_set_by_category` (priority 5) — Your theme answers using `mgw_filter_set_ids`.

**Logic:**
- On a **product category** (e.g. Ammunition): use the set for that category or its parent.
- On **Shop** or **Brand** archive: use the `default` set.
- Result is stored in option `mgw_filter_set_ids`: `ammunition → 9526`, `magazines → 9538`, `firearms → 9544`, `gun-parts → 9549`, `default → 9554`.

If Filter Everything’s `wpc_page_related_set_ids` is empty (no set found), the theme falls back to **MGW_Shop_Filters**.

### Step 3: Rendering the sidebar

**If Filter Everything has a set:**

- Filter Everything outputs its filter UI (dropdowns, checkboxes, range sliders).
- Each filter is tied to a taxonomy (`pa_caliber`) or meta (`_stock_status`, `_price`).
- The plugin uses its own term counts and query logic.

**If no set (fallback):**

- `MGW_Shop_Filters::render_filters()` runs.
- It outputs Brand, Caliber, Capacity, Bullet Type, Grain using raw SQL to compute term counts for the current product set.

### Step 4: Applying filters (URL params)

When a user picks a filter:

- **Filter Everything:** Uses slug-based URLs, e.g. `?caliber=9mm` or `?in-stock=instock`.
- **MGW_Shop_Filters:** Uses `?filter_pa_caliber=9mm` (WooCommerce layered nav style).

The main product query is modified by:

- Filter Everything’s own query logic (tax_query, meta_query).
- Your theme’s `modulargunworks_fix_instock_filter_for_variable_products` (priority 10000) — fixes In Stock for variable products by using `filter_stock_status` and the lookup table instead of postmeta.

### Step 5: Preventing redirect from stripping filters

`modulargunworks_disable_canonical_redirect_with_filters` hooks into `redirect_canonical` and stops WordPress from redirecting when any filter param is present (`filter_pa_*`, `min_price`, `max_price`, `brand`, `caliber`, etc.). This keeps filter selections from being lost on reload.

---

## 2. Category-Specific Filter Sets

Your setup varies filters by category:

| Category | Filter Set ID | Filters Shown |
|----------|---------------|---------------|
| **Ammunition** | 9526 | In Stock, On Sale, Type (Handgun/Rifle/Rimfire/Shotgun), Price, Brand, Caliber, Capacity, Bullet Type, Grain, Steel Case, Subsonic |
| **Magazines** | 9538 | In Stock, Type, Price, Brand, Capacity |
| **Firearms** | 9544 | In Stock, Type, Price, Brand |
| **Gun Parts** | 9549 | In Stock, Type, Price, Brand |
| **Gear, Optics, Reloading, Outdoors, Brands** | 9554 (default) | In Stock, On Sale, Price, Brand |

Subcategories (e.g. Ammunition > Handgun) inherit the parent’s filter set via `term->parent` lookup.

---

## 3. Data Sources (Where Filter Terms Come From)

### Taxonomies

Filter options come from **WooCommerce Global Attributes** (taxonomies):

| Taxonomy | Used For | Populated By |
|----------|----------|--------------|
| `pa_caliber` | Caliber | MGW_Attribute_Extractor (regex on product name) |
| `pa_brand` | Brand | Sync sets `_manufacturer`; Extractor uses it or parses name |
| `pa_capacity` | Capacity (magazines) | MGW_Attribute_Extractor |
| `pa_bullet_type` | Bullet Type | MGW_Attribute_Extractor |
| `pa_grain_weight` | Grain | MGW_Attribute_Extractor |
| `pa_steel_case` | Steel Case | MGW_Attribute_Extractor |
| `pa_subsonic` | Subsonic | MGW_Attribute_Extractor |
| `product_cat` | Type (Handgun/Rifle/etc.) | Sync assigns parent + child categories |

### Meta

- **In Stock:** `_stock_status` (simple) or `wc_product_meta_lookup` (variable products).
- **Price:** `_price` (min/max range).

---

## 4. The In-Stock Fix (Variable Products)

Filter Everything normally filters by `_stock_status` in postmeta. Variable products store stock on variations, so that fails.

Your theme’s `modulargunworks_fix_instock_filter_for_variable_products`:

- Listens for `?in-stock=instock` (or equivalent from `flrt_ajax_link` for AJAX).
- Sets `filter_stock_status => 'instock'` on the main query (uses WooCommerce’s lookup table).
- Strips `_stock_status` from the meta_query so variable products are included correctly.

---

## 5. Search Form Behavior

The product search form on archive pages:

- Keeps filter params when searching (via hidden inputs for `filter_pa_*`, `min_price`, `max_price`, etc.).
- Only adds `post_type=product` on the main **Shop** page, not on category pages, so category context is preserved.

---

## 6. Filter Everything Cache

Filter Everything caches term counts and product relationships in transients (`_transient_wpc_*`). After large imports or attribute changes:

- **Admin:** Filter Everything → Settings → Tools → Clear Transients / Rebuild Index.
- **WP-CLI:** `wp transient delete --all` then load one shop/category page to rebuild.

---

## 7. Summary Diagram

```
User visits /product-category/ammunition/
         │
         ▼
┌─────────────────────────────────────────┐
│ wpc_relevant_set_ids / wpc_return_*    │
│ → mgw_filter_set_ids['ammunition']     │
│ → Set ID 9526 (Ammunition Filters)     │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ Filter Everything outputs sidebar       │
│ (In Stock, Caliber, Brand, etc.)        │
│ OR MGW_Shop_Filters if no set          │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ User selects "9mm" in Caliber dropdown  │
│ → URL: ?caliber=9mm (or filter_pa_*)   │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ Main product query modified             │
│ (tax_query: pa_caliber = 9mm)          │
│ In Stock fix applied if ?in-stock=instock│
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ Product grid shows filtered results     │
│ redirect_canonical disabled for params  │
└─────────────────────────────────────────┘
```

---

## 8. Key Files

| File | Role |
|------|------|
| `modulargunworks/functions.php` | Set selection, In Stock fix, canonical redirect, Attribute Extractor hooks |
| `modulargunworks/woocommerce/sidebar-shop-filters.php` | Chooses Filter Everything vs MGW_Shop_Filters |
| `modulargunworks/includes/class-mgw-shop-filters.php` | Fallback filters with custom counts |
| `modulargunworks/woocommerce/archive-product.php` | Search form, filter param preservation |
| `mgw-setup-category-filters.php` | Defines filter sets and `mgw_filter_set_ids` |
| `modulargunworks/includes/class-mgw-attribute-extractor.php` | Populates `pa_*` from product names |
