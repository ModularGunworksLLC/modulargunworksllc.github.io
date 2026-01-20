# Modular Gunworks Product Sync - 3-Layer Filtering Architecture

## Overview

The product sync pipeline implements a **3-layer filtering system** to ensure only premium, compliant, correctly-categorized products reach the customer-facing catalog.

```
Chattanooga API (48,021 items)
        ↓
LAYER 1: Brand Filtering (TOP_BRANDS only)
        ↓
LAYER 2: Compliance Filtering (FFL, inventory, allocation)
        ↓
LAYER 3: Exclusion-First Categorization (4-pass system)
        ↓
Final Catalog (estimated 8,000-12,000 premium items)
```

---

## LAYER 1: TOP BRANDS ONLY (Premium Brand Filter)

**Goal:** Load only high-quality, brand-name products. Exclude generic, unbranded, and low-quality brands.

**Implementation:**
```javascript
const shouldIncludeBrand(product) {
    // Returns false if brand is BAD_BRANDS or NOT in TOP_BRANDS
    // Returns true ONLY if brand is in TOP_BRANDS
}
```

### TOP_BRANDS Array (54 brands)

**Firearms:**
- Glock, Smith & Wesson (S&W), Sig Sauer, Ruger, FN, HK, CZ, Walther, Springfield Armory
- Daniel Defense, BCM, Aero Precision, Geissele, Noveske, LWRC, PSA

**Optics:**
- Trijicon, EOTech, Aimpoint, Holosun, Vortex, Leupold, Primary Arms, Nightforce, Sig Optics

**Magazines:**
- Magpul, Pmag, Lancer, Hexmag, ETS, KCI

**Ammunition:**
- Federal, Hornady, Winchester, Remington, PMC, Fiocchi, Speer, CCI, Blazer, Norma

**Parts & Accessories:**
- Magpul, BCM, Geissele, Midwest Industries, Radian, Reptilia, Cloud Defensive
- SureFire, Streamlight, Safariland, Blue Force Gear, Hogue, Timney, TriggerTech

**Reloading:**
- Hornady, RCBS, Lyman, Lee, Dillon, Hodgdon, Alliant, Accurate, Vihtavuori, IMR

**Outdoors / Gear:**
- Gerber, SOG, Benchmade, Kershaw, CRKT, Streamlight, SureFire

### BAD_BRANDS Array (Excluded)
- NCSTAR, UTG, Leapers, Allen, Generic, Unbranded, Unknown
- Airsoft, Paintball, Crosman, Daisy
- Game Winner, Hunter's Specialties
- Misc, Imports

---

## LAYER 2: COMPLIANCE FILTERING

**Goal:** Remove products that are illegal to sell, out of stock, allocated, or otherwise non-compliant.

**Implementation:**
```javascript
const shouldIncludeProduct(product) {
    // Returns false if:
    // - FFL required (firearms)
    // - Serialized (special license items)
    // - Allocated/reserved (can't be sold)
    // - Inventory <= 0
    // Returns true only if product passes ALL checks
}
```

**Exclusion Rules:**
| Field | Reason | Action |
|-------|--------|--------|
| `ffl_flag === true` | Requires FFL dealer | EXCLUDE |
| `serialized_flag === true` | Requires special license | EXCLUDE |
| `allocated === true` | Reserved/allocated | EXCLUDE |
| `inventory <= 0` | Out of stock | EXCLUDE |

---

## LAYER 3: EXCLUSION-FIRST CATEGORIZATION (4-PASS SYSTEM)

**Goal:** Assign products to the correct category using exclusion logic first, then positive identification.

### PASS 1: Global Exclusions
Products matching these patterns return "gear" or are marked for exclusion:
- Gift cards, credits, vouchers
- Services (engraving, gunsmithing, labor)
- Non-products (licenses, permits, training)

### PASS 2: Positive Identification with Category Exclusions

Each category has specific **exclusion patterns** that prevent misclassification, followed by **positive match patterns** for inclusion.

#### AMMUNITION (Finished Cartridges Only)
**Exclusions:** BULLET, BRASS, PRIMER, POWDER, DIE, PRESS, SCALE, TUMBLER, BOX, CASE, POUCH, HOLSTER, CLEANER, BRUSH, TARGET
**Inclusions:** AMMO, ROUNDS, CARTRIDGE, SHOTSHELL, 9MM, 5.56, 223, 308, 45 ACP, 40 S&W, 12GA, 20GA, .22, FMJ, JHP, DEFENSE, MATCH

**Result:** No loose components, no storage, no cleaning products—only finished ready-to-shoot ammunition.

#### RELOADING (Components & Equipment)
**Inclusions:** BULLET, BULLETS, BRASS, PRIMER, PRIMERS, POWDER, DIE, PRESS, SCALE, CASE TRIMMER, TUMBLER, CALIPERS, RELOADER, PROJECTILE, .DIA, CT BULLET

**Result:** All reloading supplies: powder, primers, brass, component bullets, and equipment.

#### MAGAZINES
**Exclusions:** POUCH, HOLSTER, CARRIER, CASE, STORAGE, POWDER, PRIMER, BRASS, BULLET, RELOAD, COMPONENT
**Inclusions:** MAGAZINE, MAG, CLIP, PMAG, DRUM, LOADER

**Result:** Actual magazines only. Magazine pouches/sleeves go to gear.

#### OPTICS (Optical Devices)
**Exclusions:** COVER, CAP, MOUNT, BASE, RING, RAIL, TARGET, BAG, CASE, SLING, STRAP, CLEAN, TOOL, KIT, POUCH, BATTERY, ADAPTER, CONNECTOR, EXTENSION, CLAMP
**Inclusions:** SCOPE, RED DOT, HOLOGRAPHIC, MAGNIFIER, RIFLESCOPE, REFLEX, LASER SIGHT, OPTIC, BINOCULAR, MONOCULAR, RANGEFINDER

**Result:** Only actual optical devices. Mounts, covers, batteries, and targets go to gear.

#### GUN PARTS (Firearm Components)
**Exclusions:** CLEANER, BRUSH, BORE, SCRUBBER, DEGREASER, PUNCH, HAMMER, WRENCH, VISE, TOOL, KIT, ROD, PATCH, LUBRIC, SOLVENT, CASE, BOX, BAG, POUCH, HOLSTER, STORAGE, CARRIER, PACK, VEST, CHEST, SLING, STRAP, POWDER, PRIMER, BRASS, BULLET, RELOAD, COMPONENT, AMMUNITION, AMMO
**Inclusions:** TRIGGER, BCG, BARREL, UPPER, LOWER, BUFFER, GAS BLOCK, HANDGUARD, STOCK, GRIP, RECEIVER, CHARGING HANDLE, SAFETY, SELECTOR, SPRING, PIN, MOUNT, BASE, RING, RAIL

**Result:** Actual firearm components only. Tools and storage go to gear.

#### OUTDOORS / GEAR
**Inclusions:** KNIFE, MULTI TOOL, FLASHLIGHT, FIRST AID, MEDICAL, WATER, FIRE STARTER, PARACORD, EMERGENCY, TACTICAL, OUTDOOR, CAMPING, GEAR

**Result:** Quality outdoor/tactical items from known outdoors brands.

#### GEAR (Catch-All)
**Content:** Everything that passes exclusions but doesn't match other categories:
- Cleaning products, maintenance items
- Tools, equipment
- Storage, cases, bags
- Targets, range aids
- Miscellaneous items

---

### PASS 3: Brand Fallback
If exclusions and positive matches don't determine a category, use brand-based fallback rules:

```javascript
if (brand in reloadingBrands) return 'reloading';
if (brand in opticsBrands) return 'optics';
if (brand in magBrands) return 'magazines';
```

### PASS 4: Default to Gear
If nothing matches:
```javascript
return 'gear';  // Default category for unknown items
```

---

## Processing Pipeline

```javascript
// For each product from Chattanooga API:

if (!shouldIncludeBrand(product)) continue;     // Layer 1: Brand filter
if (!shouldIncludeProduct(product)) continue;   // Layer 2: Compliance filter
const category = categorizeProduct(product);    // Layer 3: Categorization
saveProductToCategoryJSON(category, product);   // Save to correct file
```

---

## Expected Results

### Product Volume Reduction
- **Input:** 48,021 items from Chattanooga API
- **After Brand Filter:** ~30,000 items (removes generic/cheap brands)
- **After Compliance Filter:** ~20,000 items (removes FFL items, allocated, out-of-stock)
- **After Categorization:** ~12,000 items (filters to quality only per category)
- **Final Catalog:** ~8,000-12,000 premium products

### Category Distribution (Estimated)
- **Ammunition:** 2,500-3,500 items
- **Magazines:** 800-1,200 items
- **Optics:** 600-1,000 items
- **Gun-Parts:** 1,500-2,000 items
- **Reloading:** 1,200-1,800 items
- **Outdoors:** 300-500 items
- **Gear:** 2,000-3,000 items

### Key Improvements
✓ **NO scope covers in Optics** (all go to Gear)
✓ **NO loose bullets in Ammunition** (all go to Reloading)
✓ **NO powder in Ammunition** (all go to Reloading)
✓ **NO cleaning products in major categories** (all go to Gear)
✓ **NO FFL firearms** (removed at compliance layer)
✓ **NO allocated/reserved items** (removed at compliance layer)
✓ **NO out-of-stock items** (removed at compliance layer)
✓ **NO generic/low-quality brands** (removed at brand layer)

---

## Code Location

All three layers are implemented in:
- **File:** `scripts/sync-chattanooga-api.js`
- **Top Brands:** Lines 13-35
- **Bad Brands:** Lines 37-40
- **shouldIncludeBrand():** Lines 50-63
- **shouldIncludeProduct():** Lines 65-82
- **categorizeProduct():** Lines 114-205
- **Main Pipeline:** Lines 465-495

---

## Future Enhancements

1. **Dynamic Brand Management:** Load TOP_BRANDS from external config file
2. **Logging:** Detailed logs of what was filtered at each layer
3. **Metrics:** Dashboard showing filter effectiveness
4. **Blacklist Management:** Easier tracking of bad products to avoid
5. **Testing:** Automated tests validating categorization accuracy

---

## Notes

- All filtering is **whitelist-based** (explicitly include, not exclude)
- **Brand filtering** ensures premium quality
- **Compliance filtering** ensures legal safety
- **Categorization filtering** ensures accuracy and prevents misclassification
- **3-layer approach** is redundant for safety—each layer catches different issues
