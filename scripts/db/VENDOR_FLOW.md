# Vendor Flow: Adding Vendors & API Credentials

## Multi-Vendor Features (Phases A–D)

- **Cross-vendor dedup**: Import matches by UPC or MPN+brand; creates new offer on existing product when found
- **Offer selection**: `recomputePrimaryOffers()` picks best offer (in-stock first, then lowest price)
- **Category mappings**: Uses `category_mappings` table; seed with `node scripts/db/seed-category-mappings.js`
- **Sale price**: `sale_offers.sale_price`; set via + Sale modal or activate API with `salePrice`
- **Data quality**: `GET /api/admin/data-quality` — missing images, cost, stock, duplicate UPCs
- **Merge products**: `POST /api/admin/products/merge` — merge source into target product
- **Vendor orders**: `GET /api/admin/vendors/:id/orders?format=csv` — export orders for fulfillment

## Current Flow: Adding a Vendor

### 1. Add Vendor (Admin → Vendors tab)
- Enter **vendor name** (e.g. "Chattanooga", "New Distributor")
- Select **type**: **CSV Import** or **API**
- Click **Add Vendor**
- **What happens:** `POST /api/admin/vendors` inserts a row into `vendors` with `name`, `type`, and `config` (JSON).

### 2a. CSV Import Path
- In **Import from CSV**, select the vendor and choose a `.csv` file
- Click **Import CSV**
- **What happens:** The file is read in the browser, sent as text to `POST /api/admin/import-csv`. The API parses the CSV and upserts products + offers into Neon, linked to that vendor. Credentials are not needed.

### 2b. API Path (with credentials)
- When type = **API**, you add **API credentials** (URL, key, secret) in the form
- Credentials are stored in `vendors.config` (JSON)
- **What happens:** Credentials are saved to the DB. A future **Sync from API** action will read `config`, call the vendor’s API with those credentials, and import products.

### 3. Edit / Configure Vendor
- In **Existing Vendors**, each vendor has a **Configure** button.
- Click **Configure** → modal opens with name, type, and (when type=API) credential fields.
- Change values and click **Save**.
- **What happens:** `PATCH /api/admin/vendors/:id` updates `name`, `type`, and `config` in the DB.

### Where Credentials Go
- **Storage:** `vendors.config` (JSONB) in Neon
- **Structure:** `{ apiUrl, apiKey, apiSecret, authType }`
  - `apiUrl`: base URL (e.g. `https://api.vendor.com`)
  - `apiKey`: API key or token
  - `apiSecret`: optional second credential
  - `authType`: `header` | `query` | `basic` — how the sync will send the key
- **Usage:** Sync scripts read `config` from the DB and use it when calling the vendor’s API. Credentials never go to the front end; they are only used server-side.
