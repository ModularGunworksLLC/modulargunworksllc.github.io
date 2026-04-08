# Modular Gunworks WordPress Theme – Deep Dive & Untanglement Report

**Report Type:** Analysis & Recommendations (No Code)  
**Date:** March 2, 2025  
**Scope:** Theme architecture, filters, product pages, brands, and path to simpler admin-maintainable setup

---

## Executive Summary

Your site uses a custom WordPress theme (`modulargunworks`) with heavy customization for shop filters, product display, and Chattanooga product sync. Most behavior is driven by **custom code** in `functions.php`, a custom filter sidebar, and two custom plugins. To add vendors or adjust filters, you currently depend on developer changes. This report explains how the system works, why problems occur, and how to move toward built-in WooCommerce features so you can manage more through the WordPress admin.

---

## Part 1: What Works and What You Like (Keep as-is)

### Home Page – Solid
- **Layout:** Hero, category carousel, “Why Shop,” About
- **Shop categories in banner:** Hardcoded in `front-page.php` – links to product categories (ammunition, magazines, firearms, gun-parts, gear, optics, reloading, outdoors) plus brands page
- **Search bar:** Standard WordPress/WooCommerce search
- **Account, Help, Cart:** Header links
- **Home logo:** Standard header linking to home

**Recommendation:** Leave the home page as-is.

---

## Part 2: Current Architecture – How Things Work

### Data Flow Overview
```
Chattanooga API (CSV feed)
    → MGW Chattanooga Sync plugin
    → Products, categories, images, descriptions
    → WooCommerce product_cat + pa_* attributes
    → Theme filter sidebar + archive templates
    → (Optional) MGW Populate Filter Attributes for backfill
```

### 1. Product Categories (product_cat)

**Theme creates on activation:**
- Top-level: ammunition, magazines, firearms, gun-parts, gear, optics, reloading, outdoors, brands  
- Under ammunition only: Handgun, Rifle, Rimfire, Shotgun

**Chattanooga Sync behavior:**
- Uses `category-mapping.json` (1,000+ mappings)
- Assigns products to **one** category: the top-level term only (e.g. `ammunition`, `magazines`)
- Does **not** assign to subcategories like Handgun/Rifle/Rimfire/Shotgun or Handgun Magazines/Rifle Magazines

**MGW Populate Filter Attributes:**
- For ammunition: classifies by name/caliber and assigns to Handgun, Rifle, Rimfire, Shotgun
- Must be run **after** sync for ammo subcategories to get products

### 2. Product Attributes (pa_*)

Used for filtering:
- `pa_brand` – Brand (from Manufacturer in CSV)
- `pa_caliber` – Caliber (parsed from product name)
- `pa_bullet_type` – FMJ, JHP, etc. (ammo)
- `pa_grain_weight` – 55gr, 124gr, etc. (ammo)
- `pa_capacity` – 10 rd, 30 rd, etc. (magazines)

These are created on-the-fly by the sync or Populate plugin if they don’t exist. Filter logic in `functions.php` reads `$_GET['filter_pa_caliber']`, etc., and adds taxonomy queries.

### 3. Filter Sidebar (`sidebar-shop-filters.php`)

- **“Type” filters (Ammo Type, Magazine Type, Firearm Type, Part Type):** Show **product_cat subcategories** as links
- **Attribute filters (Caliber, Bullet Type, Grain, Brand, Capacity):** Checkboxes that submit the form
- **Price:** Min/max inputs
- **Stock:** “Show Only In Stock” checkbox
- **Sort:** Dropdown

The “Type” section lists child terms of the current category. Clicking one goes to that category URL (e.g. `/product-category/ammunition/handgun/`).

### 4. Why Ammo Type Breaks vs. Magazine Type

**Ammunition:**
- Theme creates Handgun, Rifle, Rimfire, Shotgun under ammunition
- Sync puts all ammo in parent `ammunition` only
- Without running **Populate Filter Attributes**, these subcategories stay empty → wrong or zero counts
- Subcategory links go to empty or incorrect results
- “Clear All” shows weird counts (e.g. “2”) because the category (from URL) is mixed with attribute filters in the “active” logic

**Magazines:**
- Theme does **not** create magazine subcategories
- Chattanooga CSV uses entries like “Handgun Magazines,” “Rifle Magazines”
- If those terms exist under “magazines” (from mapping or another source), they work
- Or products may be placed in subcategories differently on your live site

So: Ammo fails because sync + theme + Populate don’t align. Magazines may work if subcategories exist and are populated.

### 5. Firearms, Gun Parts, Gear, Optics, Reloading, Outdoors

- **Firearms:** Theme expects subcategories (e.g. Handguns, Rifles, Shotguns). `category-mapping.json` has Handguns, Rifles, Shotguns under Firearms. Sync uses top-level only, so they go to “firearms” unless something else assigns subcategories. Sidebar shows whatever child terms exist; many may be empty or missing.
- **Gun Parts, Gear, Optics, Reloading, Outdoors:** Same pattern – rich subcategories in the mapping, but sync assigns to parent only. No automatic subcategory assignment like Populate does for ammo.

### 6. Brands Page

- Uses `pa_brand` product attribute
- `page-brands.php` shows a flat grid of all brands with logos
- Clicking a brand goes to `/product-attribute/pa_brand/{slug}/` (e.g. `/product-brand/hornady/`)
- `taxonomy-pa_brand.php` shows products for that brand with the same filter sidebar

**Limitations:**
- No “top 10” vs. “rest” separation
- No “featured” brands section
- Logos need a plugin (e.g. Perfect Brands, YITH) or manual term thumbnails

### 7. Single Product Page

**Theme changes (in `functions.php`):**
- Removes: rating, excerpt, meta, sharing, tabs, upsells, related products
- Description is removed by `woocommerce_template_single_excerpt`
- Full description is removed with the tabs

**Result:** No short or long description is shown, even though Chattanooga sync sets `$product->set_description($desc)`.

**Image:**
- Uses `_chattanooga_image_url` when set (CDN)
- CSS limits size (`max-width: 500px`) but layout can still feel oversized

---

## Part 3: Root Causes of Current Issues

### A. Sync vs. Theme Category Model
- Sync: one category per product (top-level)
- Theme: expects subcategories for “Type” filters
- Populate only fixes this for ammunition
- Other categories (firearms, magazines, gun parts, gear, optics, reloading, outdoors) lack this logic

### B. “2 Filters” in Clear All
- Active filter count includes attribute filters (brand, caliber, etc.) and price
- It does **not** include the current category
- Category is URL-based; attributes are in `$_GET`
- Possible causes: two selected attribute values (e.g. two calibers), or price + one attribute, or a bug in how stock/price/attributes are counted together

### C. Missing Filters by Category
- Sidebar is static: same sections for most categories
- Category-specific filters (handgun/rifle/shotgun for Gun Parts, red dot/scope/thermal for Optics, etc.) are not implemented
- No `pa_part_type`, `pa_optics_type`, etc., in sync or Populate

### D. Product Description Hidden
- Theme removes both excerpt and tabs
- Descriptions exist in the database but are never rendered

### E. Vendor Lock-in
- Sync is Chattanooga-specific (API, CSV, mapping)
- Adding another vendor means a new sync flow, mapping, and possibly new attributes
- Filters are hardcoded to current attributes
- Category logic is mixed between sync, Populate, and theme

---

## Part 4: Path to Untangling – Move to Built-in Features

### Phase 1: Fix Data Layer (Admin-Manageable)

1. **Use WooCommerce categories properly**
   - Extend sync (or add a post-sync step) so products are assigned to the correct subcategories, not only top-level
   - Use the existing `category-mapping.json` “sub” values (e.g. “Handgun Ammunition”, “Rifle Magazines”)
   - Create missing product_cat terms if needed, then assign products to them
   - Goal: subcategory counts and links work without Populate

2. **Define attributes in WooCommerce**
   - Create attributes under **Products → Attributes**: Brand, Caliber, Bullet Type, Grain Weight, Capacity, Part Type, Optics Type, etc.
   - Enable “Archives” for Brand
   - Use these in product edit screens instead of only populating via code
   - Sync/import can still set them, but they become normal WooCommerce attributes

3. **Re-enable product description**
   - Stop removing `woocommerce_template_single_excerpt` and optionally restore `woocommerce_output_product_data_tabs`
   - Or add a small custom template that outputs the description
   - No structural change, just stop hiding the content that sync already imports

### Phase 2: Simplify Filtering (Use a Plugin)

1. **Replace custom filter sidebar with WooCommerce filters**
   - Option A: **WooCommerce Product Filters** (or similar)
   - Option B: **YITH WooCommerce Ajax Product Filter** or **Filter Everything**
   - These plug into WooCommerce attributes and categories; you configure them in the admin
   - When you add attributes or categories, filters update automatically
   - Removes the need for custom `sidebar-shop-filters.php` and `modulargunworks_product_query_filters`

2. **Configure filters per category**
   - Most filter plugins let you choose which attributes and categories appear per page
   - You could show Ammo Type on ammunition, Magazine Type on magazines, Part Type on gun parts, Optics Type on optics, etc.
   - All managed in the plugin UI, not in PHP

### Phase 3: Brands Page (Admin-Configurable)

1. **Top brands**
   - Add a **Brand** attribute term meta (e.g. “featured” or “top_10”)
   - Or use a simple options page: “Top 10 brand slugs”
   - Template reads that list and shows logos first; remaining brands below

2. **Or use a brands plugin**
   - **Perfect Brands for WooCommerce** or **YITH WooCommerce Brands**
   - Handles logo assignment, brand pages, and sometimes featured/popular brands
   - Reduces custom code for brands

### Phase 4: Single Product Layout (CSS + Small Tweaks)

1. **Image size**
   - Adjust CSS (`woocommerce.css`) for gallery images – e.g. smaller max-width, different aspect ratio
   - No logic changes required

2. **Description**
   - As above: re-enable excerpt/tabs or add explicit description output
   - Use WooCommerce fields; sync already fills them

3. **Optional layout improvements**
   - Consider restoring tabs for better structure (Description, Specs, etc.)
   - Keep Add to Cart and FFL notices; remove only what’s not needed

### Phase 5: Multi-Vendor Strategy

1. **Unified product import**
   - Build (or use) an import that:
     - Maps vendor categories → WooCommerce product_cat
     - Maps vendor attributes → WooCommerce attributes
     - Fills description, price, images
   - Same schema for Chattanooga and future vendors; only mapping differs

2. **Attribute-driven filters**
   - Once filters use WooCommerce attributes (via plugin), any vendor that sets those attributes will appear in filters
   - Add new attributes in the admin; no theme code changes

3. **Product sources**
   - Add a “Source” or “Vendor” attribute (or meta) to distinguish vendors
   - Use for reporting, vendor-specific rules, or filters if you want “by vendor”

---

## Part 5: Recommended Order of Operations

| Priority | Task | Effect |
|----------|------|--------|
| 1 | Re-enable product description (stop removing excerpt/tabs) | Descriptions visible immediately |
| 2 | Extend sync to assign products to subcategories from mapping | Ammo/Magazine/Firearm type filters work correctly |
| 3 | Evaluate & install a WooCommerce filter plugin | Replace custom filter sidebar and query logic |
| 4 | Create missing attributes (Part Type, Optics Type, etc.) and assign in sync | Enables category-specific filters |
| 5 | Adjust single product image size via CSS | Better layout, no logic changes |
| 6 | Redesign brands page (top 10 + rest) with plugin or small template change | Matches your desired UX |
| 7 | Plan multi-vendor import (mapping + attributes) | Prepares for adding new vendors |

---

## Part 6: Files & Custom Logic to Simplify or Remove

| File / Area | Purpose | Could Be Replaced By |
|-------------|---------|----------------------|
| `functions.php` – `modulargunworks_product_query_filters` | Applies attribute filters to product query | WooCommerce filter plugin |
| `functions.php` – `modulargunworks_single_product_minimal` | Removes description, tabs, etc. | Restore default WooCommerce; adjust with hooks |
| `woocommerce/sidebar-shop-filters.php` | Custom filter UI | Filter plugin widget/shortcode |
| `mgw-populate-filter-attributes` plugin | Backfills attributes and ammo subcategories | Improved sync that does this natively |
| `mgw-chattanooga-sync` | Chattanooga-specific sync | Generalized “product import” that supports multiple vendors |
| Hardcoded attribute list in `modulargunworks_product_query_filters` | `pa_brand`, `pa_caliber`, etc. | Attributes defined in WooCommerce + plugin |
| `active_filter_count` in sidebar | “Clear All (N)” | Filter plugin’s active filter handling |

---

## Part 7: Summary – Before vs. After

**Before (current):**
- Filters: Custom sidebar + custom query logic
- Categories: Sync to parent only; Populate fixes ammo only
- Descriptions: Synced but hidden by theme
- Brands: Custom template; no featured vs. rest
- New vendor: New sync code, mapping, and likely theme changes
- Admin: Limited control; many changes need a developer

**After (target):**
- Filters: WooCommerce filter plugin using native attributes and categories
- Categories: Sync assigns correct subcategories from mapping
- Descriptions: Shown via standard WooCommerce template
- Brands: Plugin or simple template with configurable top brands
- New vendor: New mapping file and import config; same schema
- Admin: Add attributes, categories, and filter rules in the WP admin with minimal code changes

---

## Appendix: Key File Reference

| File | Role |
|------|------|
| `modulargunworks/functions.php` | Theme setup, filters, cart/checkout, FFL, single product tweaks |
| `modulargunworks/woocommerce/sidebar-shop-filters.php` | Filter sidebar UI and logic |
| `modulargunworks/woocommerce/archive-product.php` | Shop/category archive layout |
| `modulargunworks/woocommerce/content-single-product.php` | Single product layout |
| `modulargunworks/page-brands.php` | Brands tile grid |
| `modulargunworks/taxonomy-pa_brand.php` | Brand product archive |
| `plugins/mgw-chattanooga-sync/` | Chattanooga API sync |
| `plugins/mgw-chattanooga-sync/includes/category-mapping.json` | Category mapping |
| `plugins/mgw-populate-filter-attributes/` | Attribute and ammo subcategory backfill |

---

*End of report.*
