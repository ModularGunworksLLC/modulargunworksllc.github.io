# Admin as Pull Source, Neon DB, and Avoiding Sell-Then-Cancel

## The problem

When the wholesaler (e.g. Chattanooga) runs out of a product and a customer orders it on your live site, you have to cancel and refund — and you lose processing fees. To combat that, you want:

1. **Admin (or a scheduled job) to be the single place that pulls** product data from vendors.
2. **Data stored in Neon** so you have one source of truth (products + overrides).
3. **Frequent pulls** so inventory is as fresh as possible.
4. **Live site to use inventory** so you don’t sell items that are already out of stock.

---

## How to combat sell-then-cancel

### 1. Use inventory from the feed

The Chattanooga feed includes **"Quantity In Stock"**. The sync script already keeps this in:

- `data/products/all-products.json`
- `data/products/mapped-products/<Category>.json`
- `data/vendors/chattanooga/all-products.json`

The live site normalizes it to `inventory` in `scripts/load-products.js`. Use it in two ways:

- **Don’t list out-of-stock products** on category/sale/brand/search pages (so customers never see “Add to cart” for them), **or**
- **Show them** but **disable “Add to cart”** and show “Out of stock” so they can’t complete a purchase.

Recommendation: **don’t list** products with `inventory <= 0` on the main product lists, and on the **product-detail** page **disable** quantity + checkout when out of stock. That way you never charge for something you can’t fulfill.

### 2. Run pulls on a schedule

Today, `scripts/sync-products.js` can run:

- Once: `node scripts/sync-products.js`
- On a schedule (e.g. every 4 hours): `node scripts/sync-products.js --schedule`

**Run sync more often** (e.g. every 1–2 hours) so that when Chattanooga marks something out of stock, your site stops showing/selling it within that window. You can run sync from:

- A **cron job** or **scheduler** on a server (same machine as admin or a small worker), or
- A **“Pull now”** button in the admin that triggers the same sync logic (see below).

The more frequent the pull, the fewer “sold out after order” cases — at the cost of more API usage and a bit more load.

### 3. Admin as the “pull source” and Neon as the DB

**Current flow**

- Sync pulls from Chattanooga API → CSV → writes `all-products.json`, `mapped-products/*.json`, and vendor feed. Overrides come from Neon (or `overrides.json`).
- Admin reads `all-products.json` + overrides from Neon and does not call the vendor API itself.

**Target flow (admin as pull source)**

- **One place** is responsible for pulling: either the **admin server** (e.g. “Pull now” button + cron calling the same endpoint) or a **separate job** (e.g. `sync-products.js` run by cron). Both can write into Neon.
- **Neon** holds:
  - **Overrides** (already): `product_overrides` — price, hidden, mapping, image, etc.
  - **Optional products catalog**: a `products` (or `vendor_products`) table with sku, name, prices, **inventory**, category, vendor_id, last_synced_at, etc. Sync would **upsert** from the feed into this table; the live site and admin would read from Neon (or from JSON generated from Neon) instead of only from static files.

**Concrete steps**

1. **Keep sync as the puller**  
   Sync already pulls from the Chattanooga API and writes JSON. Keep that. Optionally add an HTTP endpoint on the admin server (e.g. `POST /api/sync` with a secret or auth) that runs the same sync logic so “Pull now” in the admin triggers it.

2. **Store inventory in overrides or a new table**  
   Right now overrides don’t store inventory; inventory lives only in the JSON written by sync. To make Neon the source of truth:
   - **Option A**: Add an `inventory` (and optionally `inventory_updated_at`) column to `product_overrides`, and have sync **update** override rows with the latest quantity when it runs. Admin and live site would then prefer this value when present.
   - **Option B**: Add a `products` or `vendor_products` table in Neon with full product rows (sku, name, MSRP, MAP, Price, **Quantity In Stock**, category, image, vendor_id, updated_at). Sync **upserts** from the feed into this table. The live site and admin read from Neon (or from JSON/cache generated from Neon). This is the right long-term design if you want “all product data in Neon.”

3. **Live site uses inventory**  
   - In **load-products.js**: when building the list for category/sale/brand/search, **filter out** products with `inventory <= 0` (or treat missing inventory as “show” if you want to be conservative with older data).
   - On **product-detail**: when `inventory <= 0`, **don’t render** the PayPal/checkout block (or disable it) and show “Out of stock — check back later.”
   - In **shop-products-ui.js** (and any static shop pages): **disable** “Add to cart” when `inventory <= 0` so that if you ever show out-of-stock products, they still can’t be added.

4. **Optional: re-check at checkout**  
   For extra safety, when the user clicks “Pay” (or on order submission), your backend could:
   - Re-read the latest inventory for that SKU from Neon (or from a fresh vendor API call if you add it), and
   - Refuse or warn if the item is now out of stock, before capturing payment.

That way even if inventory changed between “add to cart” and “pay,” you avoid charging for unavailable items.

---

## Summary

| Goal | Action |
|------|--------|
| Stop selling out-of-stock | Use `Quantity In Stock` on the site: hide or disable purchase when `inventory <= 0`. |
| Fresher inventory | Run sync every 1–2 hours (or more) via cron or “Pull now” from admin. |
| Admin as pull source | Run the same sync from admin (e.g. “Pull now” calling sync logic or `POST /api/sync`) and/or from cron; write results to Neon. |
| Neon as DB | Keep overrides in Neon; optionally add a products table and have sync upsert into it so all product + inventory data lives in Neon. |
| Extra safety | Optionally re-check inventory at checkout before capturing payment. |

Once inventory is used consistently on the live site and sync runs frequently, you greatly reduce the “customer orders → we have to cancel and refund” situation.
