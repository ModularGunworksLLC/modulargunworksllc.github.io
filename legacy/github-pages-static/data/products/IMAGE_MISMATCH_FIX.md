# Image / Product Mismatch – Cause and Fix

## What was wrong

Some product detail and shop pages showed the **wrong image** for a product (e.g. carcass bag showing a rifle). That happened because:

1. **Old pipeline** – The current `Gear.json` (and other mapped JSON files) were built with an older script that assigned images **by row index** from a separate file (`chattanooga-images.json`), which was a sorted list of unique URLs, not one URL per row. So row N’s product got the image at index N in that list, which often belonged to a different product.

2. **Result in JSON** – In the stored JSON, some products have:
   - **"Image Location"** – correct URL from the CSV row (from the wholesaler feed).
   - **"image"** – wrong URL (from the old index-based assignment).

So the same product had two different image URLs; code that used `image` first showed the wrong picture.

## What we changed in code

1. **Product detail page** (`product-detail.html`)  
   When building the product for display, we now use **"Image Location" first**, then `"image"`:
   - `image: row['Image Location'] || row.image`
   So even with the old JSON files, the detail page shows the correct image when "Image Location" is set.

2. **Shop pages** (`load-products.js`)  
   The normalizer now also prefers **"Image Location"** over `"image"`:
   - `image: vendor["Image Location"] ?? vendor["image"]`
   So the grid/list on category pages use the correct image when "Image Location" is present.

3. **Sync script** (`scripts/sync-products.js`)  
   The sync script already uses **only** the CSV row’s "Image Location" for each product and writes it as `image` (and the row keeps "Image Location" from the CSV). So any **new** run of the sync produces correct image–product pairing.

## What you should do

- **Re-run the product sync** so all mapped JSON files are regenerated with correct images:
  ```bash
  npm run sync
  ```
  or:
  ```bash
  node scripts/sync-products.js
  ```
  This overwrites `data/products/mapped-products/*.json` with one image URL per product taken from that product’s CSV row ("Image Location"). After that, both "Image Location" and "image" in the JSON will be correct for every product.

- **Optional** – After re-sync, you can delete this file; it’s only for reference.
