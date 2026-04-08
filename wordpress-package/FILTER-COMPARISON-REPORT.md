# Modular Gunworks vs. Competitors: Product Filter Comparison

**Date:** March 2025  
**Sites compared:** Modular Gunworks, Ammunition Depot, Brownells, Palmetto State Armory

---

## Your Current Filters (Modular Gunworks)

### On Ammunition
- In Stock Only
- Type (Handgun / Rifle / Rimfire / Shotgun) — product_cat subcategories
- Price (min/max range)
- Brand
- Caliber
- Capacity
- Bullet Type
- Grain

### On Gear (current bug)
- **Same ammo filters** — Caliber, Capacity, Bullet Type, Grain show "There are no filter terms yet"  
- **Cause:** Category-specific filter sets not yet deployed (`mgw_filter_set_ids` option missing)

### Sort options
- Default, Popularity, Average Rating, Latest, Price: Low to High, Price: High to Low

### Search
- Search by name, brand, SKU

---

## Competitor Analysis

### Ammunition Depot
| Feature | Ammunition Depot | Modular Gunworks |
|---------|------------------|------------------|
| **Price Per Round (CPR)** | ✅ Prominent on every product ("$0.27 per round") | ❌ Not shown |
| **Type subcategories** | Handgun Ammo, Rifle Ammo, Rimfire, Bulk | ✅ Handgun, Rifle, Rimfire, Shotgun |
| **Caliber / Brand / Price** | ✅ Yes | ✅ Yes |
| **Product card columns** | Position, Name, Price, Price Per Round, Best Selling | Name, Price only |
| **Bulk ammo section** | ✅ Dedicated bulk-ammo area | ❌ No |
| **Reviews** | ✅ Count shown (e.g. "621 Reviews") | ❌ Not on cards |
| **Quantity in title** | "300 rounds / $0.27 per round" | Not emphasized |

### Brownells
| Feature | Brownells | Modular Gunworks |
|---------|-----------|------------------|
| **Filter/Sort options** | Avg. Review, Price, Brand, Product, On Sale, Made in USA, New | Popularity, Rating, Latest, Price |
| **Price per round** | ✅ "$1.74/Round - $1.78/Round" | ❌ Not shown |
| **On Sale filter** | ✅ Yes | ❌ No |
| **Made in USA filter** | ✅ Yes | ❌ No |
| **Reviews/ratings** | ✅ On cards (e.g. 5.0) | ❌ Not on cards |
| **Result count control** | 96, 64, 32 per page | WooCommerce default |
| **Subcategories** | Handgun, Rifle, Shotgun, Rimfire | ✅ Same structure |

### Palmetto State Armory
| Feature | PSA | Modular Gunworks |
|---------|-----|------------------|
| **Shop Ammo by Caliber** | ✅ Dedicated caliber page | Via filter only |
| **Type** | Handgun, Rifle, Shotgun, Rimfire | ✅ Yes |
| **Quantity filter** | Bulk vs. standard | ❌ No |
| **Price-per-round focus** | Sorted by best CPR | ❌ Sort by total price only |
| **Steel cased filter** | ✅ Yes | ❌ No |
| **Subsonic filter** | ✅ Yes | ❌ No |
| **Bulk options** | 5.56, 9mm, .223, .22LR, shotgun | ❌ No |

---

## What You’re Lacking (Priority Order)

### Critical (industry standard for ammo)

1. **Price Per Round (CPR)**  
   Ammo Depot, Brownells, and PSA all show cost-per-round. Buyers rely on this for value comparison. You only show total price.

2. **Category-specific filters**  
   Gear currently shows ammo-only filters (Caliber, Bullet Type, Grain). Run `mgw-setup-category-filters.php` so Gear uses In Stock + Price + Brand only.

3. **Hide empty filters**  
   Filters with no terms (e.g. Caliber on Gear) should be hidden, not show "There are no filter terms yet."

### High value

4. **Sort by Price Per Round**  
   Competitors let users sort by best CPR. You only support sort by total price.

5. **Quantity/round count on product cards**  
   Ammunition Depot uses "300 rounds / $0.27 per round". Your cards don’t emphasize round count.

6. **Bulk ammo filter or section**  
   PSA and Ammo Depot call out bulk options. You could filter by quantity (e.g. 500+ rounds) or surface a bulk section.

### Nice to have

7. **On Sale filter**  
   Brownells offers this. You don’t have a sale filter.

8. **Steel case / Subsonic filters (ammo)**  
   PSA has these. You’d need attributes like `pa_steel_case`, `pa_subsonic`.

9. **Reviews/ratings on product cards**  
   Competitors show review counts or stars; you currently don’t.

10. **Results per page control**  
    Brownells: 96/64/32. You use the default WooCommerce setting.

11. **Made in USA filter**  
    Brownells has it; niche but useful for some buyers.

---

## Quick Wins

1. **Run the category filter setup**
   ```bash
   wp eval-file mgw-setup-category-filters.php --path=/opt/bitnami/wordpress
   ```
   This fixes Gear, Optics, and other non-ammo categories.

2. **Add Price Per Round to ammo product cards**  
   Compute `price / round_count` from product data and display it next to or instead of total price. Round count may need to come from the product title or a new attribute.

3. **Ensure hide_empty is "yes"**  
   In Filter Everything, set "Empty Terms" to "Always hide" so filters with no options don’t appear.

---

## Summary

You have a strong base (In Stock, Type, Brand, Caliber, Bullet Type, Grain, Price) that aligns with Ammo Depot and Brownells. Main gaps:

1. No **Price Per Round** anywhere  
2. **Category-specific filters** not yet active  
3. No **Sort by CPR**  
4. **Empty filters** still shown  
5. No **Bulk / Quantity** filters for ammo  
6. No **On Sale** filter  
7. No **Steel case / Subsonic** filters  

Fixing the category-specific setup (run the script) and adding Price Per Round are the highest-impact changes.
