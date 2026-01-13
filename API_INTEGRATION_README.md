# Modular Gunworks - API Integration & Product Layout

## Overview
This document outlines the RTB-style product layout structure and how live inventory data will be integrated from the Chattanooga Shooting API.

## File Structure

```
├── data/products/
│   ├── ammunition.json          # Live product data (synced from API)
│   ├── guns.json
│   ├── optics.json
│   └── ...other categories
│
├── shop/
│   ├── ammunition-new.html      # RTB-style template (demo/new format)
│   ├── ammunition.html          # Original layout (being replaced)
│   └── ...other categories
│
├── scripts/
│   ├── product-loader.js        # Loads JSON data and renders cards
│   ├── api-sync.js              # Syncs API data (runs in GitHub Actions)
│   └── cart.js
│
└── styles/
    ├── product-cards.css        # RTB-style card styling
    └── ...other styles
```

## Product Card Layout (RTB Inspired)

Each product displays as a clean card with:

```
┌─────────────────────────┐
│  [Product Image]        │
│  [Stock Badge]          │
├─────────────────────────┤
│ Brand Name (small)      │
│ Product Name (bold)     │
│                         │
│ Current Price (red)     │
│ Original Price / Save % │
│                         │
│ In Stock: 450 units     │
├─────────────────────────┤
│ [ADD TO CART BUTTON]    │
└─────────────────────────┘
```

## JSON Data Structure

Each product in the JSON follows this format:

```json
{
  "id": "CC9MM001",
  "brand": "Federal",
  "name": "Federal 9mm 115gr FMJ",
  "description": "Full metal jacket rounds...",
  "price": 12.99,
  "originalPrice": 14.99,
  "retail_price": 14.99,
  "inventory": 450,
  "inStock": true,
  "image": "../images/products/federal-9mm.jpg",
  "specs": {
    "caliber": "9mm",
    "grains": "115",
    "type": "FMJ",
    "rounds": 50
  },
  "tags": ["9mm", "fmj", "target"]
}
```

### Field Definitions:
- **id**: Unique identifier (CSSI item ID from Chattanooga API)
- **brand**: Manufacturer name
- **name**: Product display name
- **description**: Short product description
- **price**: Your cost/sale price
- **originalPrice**: MSRP/original price for comparison
- **retail_price**: API retail price
- **inventory**: Current stock count
- **inStock**: Boolean (true if inventory > 0)
- **image**: Path to product image
- **specs**: Key product specifications
- **tags**: Searchable keywords

## How Data Flows

### Step 1: API Sync (Automated via GitHub Actions)
```
Chattanooga API 
    ↓ [Every 4 hours]
sync-script.js (fetches products)
    ↓ 
Transforms to JSON
    ↓
Commits to /data/products/*.json
```

### Step 2: Page Load (User visits site)
```
ammunition.html loads
    ↓
Reads /data/products/ammunition.json
    ↓
product-loader.js renders cards
    ↓
User sees live inventory & pricing
```

## Template HTML Structure

The `ammunition-new.html` file includes:

1. **Header** - Search bar + navigation
2. **Category Nav** - Links to other shop categories
3. **Page Header** - Title and intro text
4. **Product Controls** - Sort/filter options
5. **Products Grid** - Responsive card layout
6. **Product Template** - Hidden `<template>` element (cloned for each product)
7. **Footer** - Links and info

## Styling Classes

### Grid Container
- `.products-grid` - Responsive grid layout
- Auto-fills with 220px min-width cards
- Responsive breakpoints at 768px and 480px

### Card Elements
- `.product-card` - Main card container
- `.product-image` - Image area with stock badge
- `.product-info` - Text content area
- `.product-brand` - Brand name (small, gray)
- `.product-name` - Product name (bold)
- `.product-pricing` - Price section
- `.price-current` - Sale price (red, large)
- `.price-original` - MSRP (strikethrough)
- `.price-savings` - Discount amount
- `.inventory-info` - Stock status
- `.product-button` - CTA button

### Stock Badges
- `.stock-badge.in-stock` - Green badge
- `.stock-badge.out-of-stock` - Gray badge

### States
- `.product-button.add-to-cart` - Enabled button
- `.product-button.notify` - Disabled (out of stock)

## Categories & Pages

These pages will all use the same RTB-style template:

| Category | File | JSON Source |
|----------|------|-------------|
| Ammunition | `shop/ammunition-new.html` | `data/products/ammunition.json` |
| Firearms | `shop/guns-new.html` | `data/products/guns.json` |
| Optics | `shop/optics-new.html` | `data/products/optics.json` |
| Gear | `shop/gear-new.html` | `data/products/gear.json` |
| Magazines | `shop/magazines-new.html` | `data/products/magazines.json` |
| Reloading | `shop/reloading-new.html` | `data/products/reloading.json` |
| Gun Parts | `shop/gun-parts-new.html` | `data/products/gun-parts.json` |

## Next Steps

1. ✅ Create RTB-style card CSS (`styles/product-cards.css`)
2. ✅ Build template HTML (`shop/ammunition-new.html`)
3. ✅ Create sample JSON structure (`data/products/ammunition.json`)
4. ⏳ Build API sync script (`scripts/api-sync.js`)
5. ⏳ Create GitHub Action for scheduled syncing
6. ⏳ Add product loader script (`scripts/product-loader.js`)
7. ⏳ Create pages for other categories
8. ⏳ Add to cart functionality
9. ⏳ Test live with Chattanooga API

## Key Features

- **Live Inventory**: Updates every 4 hours via GitHub Actions
- **Responsive Design**: Mobile-friendly grid layout
- **Fast Loading**: Static JSON, no API calls during browsing
- **Easy Maintenance**: One template for all categories
- **SEO Friendly**: Server-rendered HTML with real product data
- **Sorting & Filtering**: Built-in sort by price, name, etc.
- **Search**: Filter products by name/brand
- **Stock Status**: Clear in-stock/out-of-stock indicators
- **Savings Display**: Shows discount percentage vs MSRP

## Color Scheme

```css
--color-primary: #b22222;      /* Red CTA button */
--color-accent: #1a2c4b;       /* Blue nav bar */
--color-bg-dark: #181a1b;      /* Black text/header */
--color-success: #4caf50;       /* Green stock badge */
```

## Testing

To test the current layout without API:

1. Open `shop/ammunition-new.html` in a browser
2. The page loads with placeholder data from `PRODUCT_DATA` array in the script
3. Try sorting, searching, and clicking buttons
4. Adjust CSS/layout as needed before API integration

Once API is ready, replace `PRODUCT_DATA` with JSON loaded from `data/products/ammunition.json`.
