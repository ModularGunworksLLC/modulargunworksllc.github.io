# Filter & Product Layout Design

## Page Structure Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER (Search Bar + Nav)                                      │
├─────────────────────────────────────────────────────────────────┤
│  CATEGORY NAV (Ammunition | Guns | Optics | etc)               │
├──────────────────┬──────────────────────────────────────────────┤
│                  │                                              │
│  FILTERS         │  PAGE HEADER                                │
│  SIDEBAR         │  Ammunition                                 │
│  (280px)         │  Live inventory from wholesaler             │
│                  │                                              │
│  ┌─────────────┐ │  SORT/CONTROLS                              │
│  │ Filters ▼   │ │  [Sort By: Featured ▼]                      │
│  ├─────────────┤ │                                              │
│  │ Category ▼  │ │  PRODUCTS GRID (Responsive)                │
│  │  Hunting    │ │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐       │
│  │  AR-15      │ │  │Prod1 │ │Prod2 │ │Prod3 │ │Prod4 │       │
│  │  Handgun    │ │  │$12.99│ │$18.50│ │$22.00│ │$15.75│       │
│  │  Rifle      │ │  │✓ In  │ │✗ Out │ │✓ In  │ │✓ In  │       │
│  │  ✓ Rimfire  │ │  └──────┘ └──────┘ └──────┘ └──────┘       │
│  │  Shotgun    │ │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐       │
│  │  Steel Cas  │ │  │Prod5 │ │Prod6 │ │Prod7 │ │Prod8 │       │
│  │  Subsonic   │ │  │$24.99│ │$11.50│ │$30.00│ │$16.20│       │
│  │             │ │  │✓ In  │ │✓ In  │ │✓ In  │ │✓ In  │       │
│  │ Caliber ▼   │ │  └──────┘ └──────┘ └──────┘ └──────┘       │
│  │ [Search...] │ │  ... more products ...                      │
│  │  12 Gauge   │ │                                              │
│  │  9mm (554)  │ │                                              │
│  │  20 Gauge   │ │                                              │
│  │  .223 Rem   │ │                                              │
│  │  .308 Win   │ │                                              │
│  │ Show more   │ │                                              │
│  │             │ │                                              │
│  │ Casing Type │ │                                              │
│  │  ▼          │ │                                              │
│  │  Brass      │ │                                              │
│  │  Plastic    │ │                                              │
│  │  Steel      │ │                                              │
│  │ Show more   │ │                                              │
│  │             │ │                                              │
│  │ Brand ▼     │ │                                              │
│  │ [Search...] │ │                                              │
│  │  Federal    │ │                                              │
│  │  Winchester │ │                                              │
│  │  Remington  │ │                                              │
│  │  Hornady    │ │                                              │
│  │  Fiocchi    │ │                                              │
│  │ Show more   │ │                                              │
│  │             │ │                                              │
│  │ Price ▼     │ │                                              │
│  │ [$1 - $100] │ │                                              │
│  │             │ │                                              │
│  │ [Clear All] │ │                                              │
│  └─────────────┘ │                                              │
└──────────────────┴──────────────────────────────────────────────┘
│  FOOTER                                                          │
└─────────────────────────────────────────────────────────────────┘
```

## Desktop Layout (1024px+)
- **Filters Sidebar**: 280px fixed width, sticky position, left side
- **Product Area**: Fills remaining width
- **Grid**: 4 columns on 1300px+ screens
- **Gap**: 2rem between sidebar and products

## Tablet Layout (768px - 1024px)
- **Filters**: Still visible on left but narrower
- **Grid**: 3 columns
- **Sidebar Width**: Stays 280px but may scroll

## Mobile Layout (< 768px)
- **Layout**: Stacks vertically
- **Filters**: Full width at top (collapsible)
- **Products**: Full width below
- **Grid**: 1-2 columns

---

## Filter Sidebar Detailed View

### Expanded State
```
┌───────────────────────┐
│ Filters               │
├───────────────────────┤
│ Category          ▼   │ ← Clickable header
├───────────────────────┤ ← Opens/closes options
│ Hunting Ammo  (2465)  │ ← Option with count
│ ✓ AR-15 Ammo  (1651)  │ ← Checked option
│ Handgun Ammo  (2340)  │
│ Rifle Ammo    (3815)  │
│ Rimfire Ammo   (351)  │
│ Shotgun Ammo  (2535)  │
│ Show more >>>         │ ← Show more button
├───────────────────────┤
│ Caliber           ▼   │
├───────────────────────┤
│ [Search 9mm, ...]     │ ← Search input
│ 12 Gauge    (1875)    │
│ 9mm          (554)    │
│ 20 Gauge     (494)    │
│ .223 Rem     (371)    │
│ .308 Win     (316)    │
│ Show more >>>         │
├───────────────────────┤
│ Casing Type       ▼   │
├───────────────────────┤
│ [Search...]           │
│ Brass       (3372)    │
│ Plastic      (245)    │
│ Steel         (87)    │
│ Aluminum      (23)    │
│ Show more >>>         │
├───────────────────────┤
│ Bullet Type       ▼   │
├───────────────────────┤
│ [Search...]           │
│ Training     (702)    │
│ Hollow Point (493)    │
│ FMJ          (457)    │
│ Hunting      (437)    │
│ Plated       (323)    │
│ Show more >>>         │
├───────────────────────┤
│ Price             ▼   │
├───────────────────────┤
│ [$1        ]          │
│      to               │
│ [$8354.99 ]           │
├───────────────────────┤
│ Stock             ▼   │
├───────────────────────┤
│ ✓ Show Only In Stock  │
├───────────────────────┤
│                       │
│ [Clear All Filters]   │ ← Active when filters applied
│                       │
└───────────────────────┘
```

### Collapsed State
```
┌───────────────────────┐
│ Category          ▼   │ ← Click to expand
│ Caliber           ▼   │
│ Casing Type       ▼   │
│ Bullet Type       ▼   │
│ Price             ▼   │
│ Stock             ▼   │
└───────────────────────┘
```

---

## Product Card Display

```
┌─────────────────────┐
│   [Product Image]   │ ← 200px height
│   [In Stock ✓]      │ ← Green badge
├─────────────────────┤
│ FEDERAL             │ ← Brand (small, gray)
│ Federal 9mm 115gr   │ ← Product name (bold)
│ FMJ                 │
│                     │
│ $12.99              │ ← Current price (RED, large)
│ $14.99 Save 13%     │ ← Original & savings
│                     │
│ In Stock: 450 units │ ← Green text
├─────────────────────┤
│ [ADD TO CART]       │ ← Red button
└─────────────────────┘

┌─────────────────────┐
│   [Product Image]   │
│   [Out of Stock ✗]  │ ← Gray badge
├─────────────────────┤
│ SPEER               │
│ Speer 45 ACP 230gr  │
│ JHP                 │
│                     │
│ $18.50              │ ← Current price (RED)
│ $21.50 Save 14%     │
│                     │
│ Out of Stock        │ ← Gray text
├─────────────────────┤
│ [NOTIFY ME]         │ ← Disabled gray button
└─────────────────────┘
```

---

## Filter Application Flow

### Initial Load
1. Page loads with all products displayed
2. Filters render with accurate product counts
3. User can see what products are available

### User Selects Filter
Example: Click "9mm" caliber
1. Filter highlights/checks
2. Product grid updates instantly (filtered)
3. Product count updates ("23 products")
4. "Clear All Filters" button becomes active (red)
5. Other filter counts update (only show applicable options)

### Filter Interaction Example
```
User: Selects "9mm" + "Hollow Point"
System:
  - Filters grid by caliber = 9mm AND bullet type = Hollow Point
  - Updates product count: "12 products"
  - Other filters (Brand, Casing) counts update to show only 
    products matching current filters
  - Grayed out options with 0 matching products
  - "Clear All Filters" button active
```

### Mobile Filter Behavior
```
On mobile, a toggle button appears:
┌──────────────────────────────────────┐
│ [☰ Filters] [← Results (12)]          │
└──────────────────────────────────────┘

Clicking [☰ Filters] slides out the sidebar:
┌──────────────────────┬───────────────┐
│ Filters (Slide Out)  │ Products (12) │
│                      │               │
│ Category          ▼  │               │
│ [Search options...]  │ [Grid]        │
│                      │               │
└──────────────────────┴───────────────┘
```

---

## Color Scheme for Filters

### Filter States
- **Active Filter**: Text color = `#b22222` (Red)
- **Inactive Filter**: Text color = `#333` (Dark gray)
- **Filter Background**: `#f9f9f9` (Light gray)
- **Filter Header Border**: `#e0e0e0` (Gray)
- **Filter Search Input**: `#fff` with `#ddd` border

### Sidebar Styling
- **Background**: `#f9f9f9` (Light gray)
- **Border**: `1px solid #e0e0e0`
- **Padding**: `1.5rem`
- **Max Width**: `280px`
- **Border Radius**: `6px`

---

## Responsive Breakpoints

| Screen Size | Layout | Sidebar | Grid Cols |
|-------------|--------|---------|-----------|
| > 1024px   | Side-by-side | Sticky left | 4 |
| 768-1024px | Side-by-side | Scrollable | 3 |
| < 768px    | Stacked | Collapsible | 1-2 |

---

## Filter Search Feature

When user types in filter search box:
```
Before: All options visible
┌─────────────────────┐
│ [Search...]         │
│ 12 Gauge    (1875)  │
│ 9mm          (554)  │
│ 20 Gauge     (494)  │
│ .223 Rem     (371)  │
│ .308 Win     (316)  │
└─────────────────────┘

After: User types "9"
┌─────────────────────┐
│ [Search 9...]       │
│ 9mm          (554)  │
│ .223 Rem     (371)  │
│ .308 Win     (316)  │
└─────────────────────┘
(Note: .223, .308 match because they contain "9")
```

---

## Show More/Less Toggle

### Initial State (showCount = 5)
```
Caliber ▼
[Search...]
 12 Gauge   (1875)
 9mm         (554)
 20 Gauge    (494)
 .223 Rem    (371)
 .308 Win    (316)
[Show more >>>]     ← Shows if > 5 options
```

### After Clicking "Show more"
```
Caliber ▼
[Search...]
 12 Gauge   (1875)
 9mm         (554)
 20 Gauge    (494)
 .223 Rem    (371)
 .308 Win    (316)
 7.62x39     (245)
 5.56 NATO   (201)
 .45 ACP     (189)
 .40 S&W     (156)
 ... all options ...
[Show less <<<]     ← Changes to collapse
```

---

## Filter Results Info Banner

When filters are applied:
```
┌──────────────────────────────────┐
│ ℹ️  Filtering by:                 │
│ 9mm, Hollow Point, Federal       │
│ [Clear All Filters]              │
└──────────────────────────────────┘
```

This banner appears above the product grid to show active filters.

---

## Desktop Example: Full Page

```
AMMUNITION
Live inventory from wholesaler

[Sort: Featured ▼]

FILTERS                     | PRODUCTS GRID
Category ▼                  | [Prod1] [Prod2] [Prod3] [Prod4]
 Hunting (2465)             | [Prod5] [Prod6] [Prod7] [Prod8]
 AR-15 (1651)               | [Prod9] [Prod10] [Prod11] [Prod12]
 Handgun (2340)             |
 Rifle (3815)               | Showing 12 of 9830 products
 Rimfire (351)              |
 Shotgun (2535)             |
 ✓ Steel Cased (68)         |
 Subsonic (87)              |
                            |
Caliber ▼                   |
[Search...]                 |
 12 Gauge (1875)            |
 9mm (554)                  |
 20 Gauge (494)             |
 .223 Rem (371)             |
 .308 Win (316)             |
 [Show more]                |
                            |
Casing Type ▼               |
[Search...]                 |
 Brass (3372)               |
 Plastic (245)              |
 Steel (87)                 |
 [Show more]                |
                            |
Brand ▼                     |
[Search...]                 |
 Federal (1308)             |
 Winchester (945)           |
 Remington (714)            |
 Hornady (551)              |
 [Show more]                |
                            |
Price ▼                     |
[$1 -------- $8,355]        |
                            |
[Clear All Filters]         |
```

---

## Implementation Checklist

✅ Filter sidebar (sticky, responsive)  
✅ Collapsible filter groups  
✅ Search within filters  
✅ Show more/less toggle  
✅ Product count per filter  
✅ Filter application logic  
✅ Product grid updates  
✅ Mobile responsive layout  
✅ Clear all filters button  
✅ Filter results banner  

---

This layout mirrors PSA's design while fitting your brand colors and structure. The sidebar is sticky on desktop, collapses on mobile, and filters update the product grid in real-time.
