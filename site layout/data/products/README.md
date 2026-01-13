# Product Data Model & Ingestion Blueprint

## Unified Product JSON Schema
See `schema.json` for the full schema. Each product must include:
- id, sku, upc, mpn (if available)
- title, brand, category, subcategory
- description, images (array)
- price, map_price (if applicable)
- in_stock, stock_quantity
- supplier, supplier_sku
- attributes (object: caliber, action, etc.)
- tags (array for filters)
- ffl_required (boolean)
- restricted_states (array of state codes)

## Ingestion Blueprint
1. **Supplier Data Import**
   - Accept CSV, Excel, XML, JSON, or API feeds from suppliers.
   - Map supplier fields to unified schema fields.
   - Normalize categories using a mapping table (see `categories.js`).
   - Parse and map attributes (e.g., caliber, action, barrel_length).
2. **Category Assignment**
   - Use supplier category fields and product attributes to assign top-level and subcategory.
   - Example: If supplier category is "Pistol" and caliber is "9mm", assign category: "handguns", subcategory: "semi-auto".
3. **Filter Tag Generation**
   - Generate tags from attributes and key fields (e.g., brand, caliber, platform).
   - Tags are used for client-side filtering.
4. **Multi-Supplier Inventory Merging**
   - Merge products by UPC (or other unique identifier).
   - If multiple suppliers offer the same UPC, merge inventory and choose which supplier to show based on:
     - Availability (in_stock)
     - Price (lowest)
     - Priority rules (configurable)
5. **Compliance Logic**
   - Set `ffl_required: true` for firearms and regulated parts.
   - Populate `restricted_states` based on product type and supplier restrictions.

## Adding New Products
- Add new product JSON files or append to `sample.json` in `/data/products/`.
- Validate against `schema.json`.
- Add images to `/assets/images/` (use `placeholder.jpg` if needed).

## Extending Categories & Filters
- Update `/scripts/categories.js` and `/scripts/filters.js` to add new categories or filter logic.
- Update UI as needed for new filter types.

## Future Supplier Feeds
- To plug in new supplier feeds, create a mapping script to transform supplier data into the unified schema, then merge or append to the product JSON files.
