# Product flow: Wholesaler → Admin → Live site

This doc describes how products move from the wholesaler feed to the live website and how the admin tool fits in. Getting this right for one wholesaler (Chattanooga) makes adding more later much easier.

## Golden rules (pricing)

- **List price** (what customers see) is **override** (admin), then **MSRP**, then **MAP**. **Dealer/cost price is never used as the list price.**
- Any product that has **MSRP or MAP** (or an override) **loads on the site**. Only products missing **both** MSRP and MAP (and no override) do not appear.
- "Active" in admin means **shown on the live site**: mapped to a category + not hidden + has a list price (override, MSRP, or MAP).

## Data flow

```
Wholesaler API/CSV (Chattanooga)
        │
        ▼
  sync-products.js
        │
        ├──► data/products/all-products.json     (every product from feed; used by admin)
        ├──► data/vendors/chattanooga/all-products.json  (same, vendor-specific)
        │
        └──► data/products/mapped-products/*.json  (only products that can appear on site)
                    │
                    │  Written only when:
                    │  • Category is mapped (feed category or override mapping)
                    │  • Not hidden (overrides)
                    │  • Has list price: override OR MAP OR MSRP (never dealer Price)
                    │
                    ▼
        Live site (shop pages, load-products.js)
                    │
                    │  Reads mapped-products/*.json
                    │  displayPrice = override ?? MSRP ?? MAP ?? null
                    │  Shows only products with displayPrice > 0
                    ▼
        Customer sees product with list price (override, then MSRP, then MAP)
```

## Admin behavior

- **Listed on site** (default tab): products that **would** appear on the live site. Same rule as sync: mapped + not hidden + has list price (override/MAP/MSRP). Loaded from `all-products.json`, then filtered by this rule.
- **Chattanooga** tab: full feed from `all-products.json`; use for mapping and overrides. Products without MAP/MSRP need an **override price** in Edit to ever show on the site.
- **Your price** column (and Edit “list price”): override → MSRP → MAP. Dealer price is shown only as “cost” for margin, never as the customer-facing price.
- **Active** column: “Active” only when the product is in the “Listed on site” set (mapped + not hidden + has list price). “No” otherwise (hidden, unmapped, or no MAP/MSRP/override).

## Sync (scripts/sync-products.js)

1. Fetches product feed URL from Chattanooga API, downloads CSV.
2. For each row:
   - Applies category mapping (template + overrides).
   - Applies overrides: hidden, priceOverride, imageUrl, mapping.
   - Pushes **every** product to `all-products.json` (and vendor copy).
   - Pushes to **mapped-products** only if: **mapped** + **not hidden** + **has list price** (override or MAP or MSRP > 0). So the live site’s JSON files never contain products that cannot be shown.

## Live site (scripts/load-products.js)

- Loads from `data/products/mapped-products/<Category>.json`.
- `displayPrice` = override ?? MSRP ?? MAP ?? null (order: override, then MSRP, then MAP; never dealer).
- Filters out products with no or zero display price. Products with either MSRP or MAP (or override) load; only those missing both MSRP and MAP are excluded.

## Neon Postgres (optional)

- **Overrides** can be stored in **Neon Postgres** instead of `data/products/overrides.json`.
- Set **`DATABASE_URL`** in `.env` to your Neon connection string (from the Neon dashboard). Admin and sync both use it when set.
- **Admin:** On startup, if `DATABASE_URL` is set, creates the `product_overrides` table if needed and reads/writes overrides from Postgres. Otherwise uses the JSON file.
- **Sync:** If `DATABASE_URL` is set, loads overrides from Postgres before building mapped-products; otherwise loads from the file.
- **One-time migration:** After creating the Neon DB, run `npm run migrate:overrides` to copy existing `overrides.json` into Postgres. Then you can rely on the DB (and keep the file as a backup if you like).

## Keeping admin and live site in sync (no lost path)

- **Single source of truth for overrides:** Neon Postgres (or `data/products/overrides.json`). Admin and sync both read/write the same store. Admin saves mapping, price override, hidden, image URL; sync reads those when building `mapped-products/*.json`.
- **SKU consistency:** Admin and server trim SKU when saving and when merging overrides. Sync trims SKU when looking up overrides so CSV rows with leading/trailing spaces still find admin-saved overrides. That way admin-mapped products are not dropped during sync.
- **Pipeline order:** 1) Edit in admin (saves to Neon/file). 2) Run sync (`node scripts/sync-products.js`) so mapped-products and all-products are refreshed from feed + overrides. 3) Live site reads only from mapped-products; it does not read overrides directly. So **after any admin changes you care about on the live site, run sync** before expecting those changes on the shop pages.

## Testing before merge (local)

1. **Admin:** `npm run admin` → http://localhost:3001. Map/edit products as needed; confirm they save and move off “Unmapped only” when mapped.
2. **Sync:** `node scripts/sync-products.js` (or `npm run sync`). Check console for “Done. N mapped, M total” and that mapped count reflects your expectations.
3. **Main site:** `npm start` (or `node serve.js`) → http://localhost:3000. Open a shop category (e.g. Gun Parts, Optics). Confirm products and prices look correct and the product you mapped appears where expected.
4. Then merge/deploy when satisfied.

## Adding more wholesalers later

- Keep **one list price rule**: override or MAP or MSRP only; dealer never as list price.
- Sync can write vendor-specific files (e.g. `data/vendors/<vendor>/all-products.json`) and a **merged** catalog for the live site; admin can have a tab per vendor and “list this offer” in Edit.
- Reuse the same “listed” logic: mapped + not hidden + has list price.
