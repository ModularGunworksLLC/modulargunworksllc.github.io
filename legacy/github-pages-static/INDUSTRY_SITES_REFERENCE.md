# Industry Sites Reference: Retailers & Distributors

Quick reference for how other firearms/ammo industry sites are structured and how they compare to your dealer setup (Modular Gunworks + Chattanooga wholesaler).

---

## Retailers (customer-facing)

### Ammunition Depot  
**ammunitiondepot.com** — Online retailer (ammo + guns + gear).

| Aspect | Details |
|--------|--------|
| **Focus** | Bulk ammo, popular calibers (9mm, 223/5.56, 22LR, 308, 45 ACP, 12ga), firearms, magazines |
| **Nav categories** | **Optics & Sights** (scopes, red dots, lasers, magnifiers, sights, rangefinders, binoculars, night vision, mounts/rings/caps), **Prep and Survival** (tactical medical, emergency food/water, first aid, survival kits), **Shop By Brand**, **On Sale** |
| **Other** | Magazine Finder (by category, platform, caliber, manufacturer), Deal of the Day, gift cards, FFL info, blog, Credova financing |
| **Useful for you** | Category ideas: Prep/Survival as a top nav item; optics broken into subcategories; “Shop by brand” and “On sale” as standard nav |

---

### Palmetto State Armory (PSA)  
**palmettostatearmory.com** — Major retailer (guns, ammo, parts, optics, gear).

| Aspect | Details |
|--------|--------|
| **Focus** | Firearms (handguns, shotguns, rifles, AR-15, AR-10, AK-47), ammo, optics, gun parts, magazines, suppressors |
| **Nav categories** | **Shop All** · **Optics** · **Gun Gear** · **Gun Parts** · **Magazines** · **Gunsmithing** · **Knives** · **Reloading** · **Holsters** · **Apparel** · **Outdoor Recreation** · **Home & Gifts** · **Guns** (Handguns, Shotguns, Rifles) · **PSA** (AR-15, AR-10, AK-47) · **Ammo** · **Suppressors** · **Brands** |
| **Promo** | Daily Deals, Clearance, free shipping on suppressors, rebates, “Shop ammo by caliber,” “Bulk ammo,” “Shop by brand” |
| **Useful for you** | Strong overlap with your categories (ammo, optics, gun parts, magazines, reloading, outdoors, brands). PSA adds: Suppressors, Gunsmithing, Knives, Holsters, Apparel, Home & Gifts, Daily Deals, Clearance. Good template for nav and category names. |

---

### Cabela’s / Bass Pro Shops  
**cabelas.com**, **basspro.com** — Large outdoor retailers (firearms are one segment).

| Aspect | Details |
|--------|--------|
| **Focus** | Full outdoor (hunting, fishing, camping) + firearms |
| **Firearms** | Centerfire pistols, centerfire rifles, shotguns, **used guns** (used shotguns, handguns, rifles) |
| **Useful for you** | Fewer shooting-specific categories than PSA/Ammo Depot. “Used guns” is a differentiator if you ever add that. Otherwise useful mainly for broad outdoor positioning, not category copy. |

---

## Distributors / Wholesalers (B2B — like your Chattanooga relationship)

### Chattanooga Shooting Supply  
**developers.chattanoogashooting.com** — Your current wholesaler.

| Aspect | Details |
|--------|--------|
| **Role** | Wholesaler/distributor; family-owned, Chattanooga TN |
| **API** | REST API: product feed, orders, shipments, invoices. You use SID + Token (MD5). Product feed CSV has SKU, name, price, category, **Image Location**, etc. |
| **Catalog** | 50,000+ SKUs: firearms, ammo, cases, crossbows, knives, military gear, apparel |
| **Your use** | Single script `sync-products.js` pulls feed → maps categories → writes `mapped-products/*.json` for your shop. |

---

### Kroll International  
**krollcorp.com** — Wholesale-only distributor.

| Aspect | Details |
|--------|--------|
| **Role** | Wholesale-only: LE, public safety, military, homeland security, shooting sports |
| **Catalog** | 160,000+ products, 160+ manufacturers (e.g. Smith & Wesson, Sig Sauer, 5.11, Blackhawk, Galco, Streamlight, Gerber) |
| **Model** | B2B only; no minimum for new dealers |
| **Useful for you** | If you ever add a second wholesaler, Kroll is a major option. Category/brand overlap with what you already carry from Chattanooga. |

---

### RSR Group  
**rsrgroup.com** (B2B) — National wholesaler.

| Aspect | Details |
|--------|--------|
| **Role** | Wholesale distributor since 1977; B2B to FFL dealers only |
| **Locations** | HQ Winter Park FL; distribution in Fort Worth TX; sales in NY, FL, NV, TX, WI |
| **Services** | Same-day processing, inventory management, expedited shipping, real-time tracking |
| **Tech** | API and real-time inventory feeds for dealer systems; integrates with platforms like Gearfire |
| **Useful for you** | Another potential second source; known for API/inventory feeds if you ever multi-source. |

---

## Comparison to your site (Modular Gunworks)

| You have (shop nav) | Ammo Depot | PSA | Cabela’s/Bass Pro |
|---------------------|------------|-----|-------------------|
| Ammunition          | ✓ (plus caliber breakdown) | ✓ Ammo | ✓ (broad) |
| Magazines           | ✓ (with finder) | ✓ | — |
| Gun Parts           | ✓ (as “Gun Parts”) | ✓ Gun Parts | — |
| Gear                | ✓ (optics, prep/survival) | ✓ Gun Gear | ✓ (outdoor) |
| Optics              | ✓ (detailed subcats) | ✓ Optics | ✓ |
| Reloading           | — | ✓ | ✓ (limited) |
| Outdoors            | ✓ Prep & Survival | ✓ Outdoor Recreation | ✓ Core |
| Brands              | ✓ Shop by Brand | ✓ Brands | ✓ |
| Sale                | ✓ On Sale | ✓ Daily Deals, Clearance | ✓ |
| **Guns**            | ✓ | ✓ (big focus) | ✓ + Used |
| **Suppressors**     | — | ✓ | — |
| **Gunsmithing**     | — | ✓ | — |
| **Knives**          | — | ✓ | ✓ |
| **Holsters**        | — | ✓ | — |
| **Apparel**         | — | ✓ | — |

**Takeaways**

- Your nav is already aligned with the main retailer categories (ammo, mags, gun parts, gear, optics, reloading, outdoors, brands, sale).
- PSA-style additions you could consider as you grow: **Suppressors**, **Gunsmithing**, **Knives**, **Holsters**, **Apparel**, and a clear **Daily Deals / Clearance** or **On Sale** link.
- Ammo Depot’s “Prep and Survival” is a good name for a category you might map from Chattanooga (or later Kroll/RSR) into something like **Outdoors** or a dedicated **Prep & Survival** page.
- For distributors: Chattanooga is your current single source; Kroll and RSR are the main other wholesalers to know about if you ever add a second feed or multi-source inventory.

---

## Making your shop pages work like theirs

Your shop pages now use a **shared script** (`scripts/shop-products-ui.js`) so they behave like Ammo Depot / PSA:

| Feature | What you have |
|--------|----------------|
| **Filters from data** | Category, Type, Brand (and on Ammunition: Caliber, Bullet Type, Grain) are built from loaded products. No hard-coded lists. |
| **Search** | `#product-search` filters by product name, brand, or SKU (add this input on any shop page to enable). |
| **Sort** | Price low/high, name A–Z, newest. |
| **Pagination** | Grid shows 24 per page with a **Load more** button. List view shows all filtered results. |
| **Product links** | Each card links to **product-detail.html?sku=...&category=...** so customers can see full details (and product-detail loads from `data/products/mapped-products/` by SKU). |
| **Clear filters** | “Clear All” in the filter sidebar. |
| **Grid / List view** | Toggle between grid and table list. |

**Scripts:** `load-products.js` loads the category JSON and calls `onProductsLoaded(products)`. `shop-products-ui.js` defines `onProductsLoaded`, populates filters, handles search/filter/sort/pagination, and renders the grid/list with product links. Add `id="product-search"` (or class `product-search`) on a shop page to enable live search.

---

## File location

This reference lives in the repo as **`INDUSTRY_SITES_REFERENCE.md`**. Update it when you add new categories, nav items, or wholesalers.
