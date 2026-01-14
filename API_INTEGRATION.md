# Chattanooga Shooting API Integration

This integration syncs product inventory and pricing from Chattanooga Shooting's wholesale API to your Modular Gunworks website.

## Setup

### 1. Add GitHub Secrets

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

- `CHATTANOOGA_SID`: Your API SID
- `CHATTANOOGA_TOKEN`: Your API Token

### 2. How It Works

**GitHub Actions Workflow** (`.github/workflows/sync-products.yml`):
- Runs automatically every 4 hours
- Pulls product data from Chattanooga API
- Saves data to JSON files in `/data/products/`
- Auto-commits changes back to the repository

**Data Files** (`/data/products/`):
- `ammunition.json`
- `magazines.json`
- `gun-parts.json`
- `gear.json`
- `optics.json`
- `reloading.json`
- `survival.json`

**Frontend Loader** (`scripts/product-loader.js`):
- Loads product JSON files in your shop pages
- Renders products as cards or grids
- Handles stock status, pricing, and FFL requirements

## Using in HTML

### 1. Include the CSS and JS

```html
<!-- In <head> -->
<link rel="stylesheet" href="styles/products.css">

<!-- Before </body> -->
<script src="scripts/product-loader.js"></script>
```

### 2. Create a Container

```html
<div id="products-container" class="products-grid"></div>
```

### 3. Initialize and Load

```html
<script>
  const loader = new ProductLoader();
  
  // Load products for ammunition category
  loader.loadProducts('ammunition').then(() => {
    // Render products
    loader.renderProducts('products-container', {
      limit: 20,
      sortBy: 'price',
      inStockOnly: true
    });
  });
</script>
```

## Product Structure

Each product in the JSON files has:

```json
{
  "id": "unique-product-id",
  "name": "Product Name",
  "retailPrice": 19.99,
  "customPrice": 17.99,
  "mapPrice": null,
  "inventory": 100,
  "inStock": true,
  "serialized": false,
  "requiresFfl": false,
  "dropShip": true,
  "dropShipPrice": 19.99,
  "lastUpdated": "2026-01-14T12:00:00Z"
}
```

## API Methods

### Load Products
```javascript
await loader.loadProducts('category')
```

### Render Products
```javascript
loader.renderProducts('container-id', {
  limit: 50,
  sortBy: 'price', // 'name' or 'price'
  inStockOnly: true,
  template: customTemplate
})
```

### Search
```javascript
const results = loader.search('9mm')
```

### Get Stats
```javascript
const stats = loader.getStats()
// { total: 1000, inStock: 950, outOfStock: 50, ... }
```

## Categories and Manufacturer Mapping

The sync script maps these categories to Chattanooga manufacturer codes:

- **ammunition**: FC, WIN, REM, SPR, CCI, PMC, HSM, LAP, GFL
- **magazines**: MAG, ETS, PMAG
- **gun-parts**: BCM, DD, LMT, CMMG, FAL, AR15
- **gear**: CRYE, ESSTAC, HSGI, FERRO
- **optics**: EOTECH, ACOG, LEUP, SIG, STEYR
- **reloading**: LYMAN, RCBS, LEE, DILLON
- **survival**: YETI, BENCHMADE, CONDOR, SPEC

Update these in `scripts/sync-chattanooga-api.js` as needed.

## Manual Sync

To manually trigger a sync outside the scheduled runs:

1. Go to your GitHub repo
2. Actions tab → "Sync Products from Chattanooga API"
3. Click "Run workflow"

## Troubleshooting

**Products not syncing?**
- Check GitHub Action logs for errors
- Verify `CHATTANOOGA_SID` and `CHATTANOOGA_TOKEN` secrets are set correctly
- Check that manufacturer IDs in the script match Chattanooga's system

**Products not displaying?**
- Open browser DevTools → Console
- Check for any JavaScript errors
- Verify the JSON file path is correct
- Check that product data exists in the JSON file

**Products loading slowly?**
- JSON files are cached in browser - hard refresh (Ctrl+Shift+R) to clear
- Consider setting a higher `limit` in your page to batch-load fewer products

## Future Enhancements

- [ ] Add support for multiple pages of results
- [ ] Implement product image caching
- [ ] Add search functionality to product pages
- [ ] Create product detail pages with specifications
- [ ] Add shopping cart integration
- [ ] Implement price tracking and alerts
