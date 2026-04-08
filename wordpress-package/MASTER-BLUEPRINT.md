# Architectural Overhaul — Master Blueprint

**Status:** ✅ **IMPLEMENTED**  
**Goal:** Professional retailer architecture (Ammo Depot–style) with Universal Normalizer, Attribute Extractor, and crash-safe batching.

---

## Task 1: Universal Normalization Layer ✅

| Requirement | Implementation |
|-------------|----------------|
| MGW_Normalizer class | `plugins/mgw-chattanooga-sync/includes/class-mgw-normalizer.php` |
| JSON vendor map | `plugins/mgw-chattanooga-sync/includes/chattanooga-map.json` |
| Standardized object | `MGW_Normalizer::normalize($row, $vendor_map)` → `sku`, `name`, `price`, `stock`, `brand`, `category_key`, `image_url`, `description`, `upc` |
| Sync uses Normalizer | `class-mgw-sync.php` lines 279–291 — converts raw CSV to standard keys before save |

**To add Lipsey's/Zanders:** Create `lipsays-map.json` with column mappings; no sync code changes.

---

## Task 2: Global Attribute Extraction (The Brain) ✅

| Requirement | Implementation |
|-------------|----------------|
| MGW_Attribute_Extractor class | `modulargunworks/includes/class-mgw-attribute-extractor.php` |
| Regex extraction | Caliber, grain_weight, capacity, bullet_type, steel_case, subsonic, round_count, brand |
| Global taxonomies | `pa_caliber`, `pa_grain_weight`, `pa_capacity`, `pa_bullet_type`, `pa_brand`, `pa_steel_case`, `pa_subsonic` |
| Hook: woocommerce_before_product_object_save | `modulargunworks/functions.php` lines 264–274 |
| Hook: woocommerce_new_product | `modulargunworks/functions.php` lines 276–281 |

**Note:** Taxonomy is `pa_grain_weight` (WooCommerce convention), not `pa_grain`. Filter Everything uses `pa_grain_weight`.

---

## Task 3: Category & Filter Fix ✅

| Requirement | Implementation |
|-------------|----------------|
| Parent + Child categories | `class-mgw-sync.php` lines 306–347 — `sub_to_slug()`, `get_or_create_subcategory()` |
| Assign both terms | `wp_set_object_terms($product_id, [$parent_id, $child_id], 'product_cat')` |
| Brand via pa_brand | Sync sets `_manufacturer` meta → Attribute Extractor reads it → `pa_brand` term. Theme uses `pa_brand`. |

---

## Task 4: Small Instance Safety ✅

| Requirement | Implementation |
|-------------|----------------|
| Batch limit: 50 | `class-mgw-sync.php` line 277 |
| usleep(500000) | After each `$product->save()` — line 334 |
| wp_cache_flush() every 10 products | Lines 358–364 |
| wp_cache_flush() + gc_collect_cycles() at end | Lines 370–371 |
| batch_offset saved after every product | Line 355 — `update_option('mgw_chattanooga_batch_offset', $count)` |

---

## Constraint: Preserved

| Keep | Location |
|------|----------|
| Theme styling | `modulargunworks/` — layout, design-system, woocommerce.css |
| Services page | Theme templates / pages |
| Footer / Company pages | Theme templates |
| Age gate, FFL notices, CPR display | `modulargunworks/functions.php` |

**Refactored only:** Product data pipeline, category logic, sync batching. No visual/structural theme changes.

---

## File Map

```
modulargunworks/
├── includes/
│   └── class-mgw-attribute-extractor.php   # Task 2: Brain
├── functions.php                          # Task 2: Hooks

plugins/mgw-chattanooga-sync/
├── includes/
│   ├── class-mgw-normalizer.php           # Task 1: Traffic Controller
│   ├── class-mgw-sync.php                 # Tasks 1, 3, 4
│   ├── chattanooga-map.json               # Task 1: Vendor map
│   └── category-mapping.json              # Task 3: Category mapping
```

---

## Run Commands

```bash
# Single batch (50 products)
sudo /opt/bitnami/wp-cli/bin/wp eval "MGW_Chattanooga_Sync::instance()->run_sync();" --path=/opt/bitnami/wordpress

# Full looper (continuous)
~/run_full_sync.sh

# Verify Caliber counts
sudo /opt/bitnami/wp-cli/bin/wp term list pa_caliber --field=count --path=/opt/bitnami/wordpress | awk '{s+=$1} END {print "Caliber: " s}'

# Clear Filter Everything cache
sudo /opt/bitnami/wp-cli/bin/wp transient delete --all --path=/opt/bitnami/wordpress
```

---

## Adding a New Vendor

1. Create `plugins/mgw-chattanooga-sync/includes/lipsays-map.json`:
   ```json
   { "vendor_id": "lipsays", "columns": { "sku": ["SKU"], "name": ["ProductName"], ... } }
   ```
2. Create `category-mapping-lipsays.json` if category hierarchy differs.
3. Add thin sync class that fetches CSV, calls `MGW_Normalizer::normalize()`, then shared importer logic.
4. No changes to Normalizer, Extractor, or theme.
