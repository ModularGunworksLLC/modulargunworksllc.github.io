# WordPress Page Setup

After installing the theme, create these pages in **Pages → Add New** so all header/footer links work:

| Page Title | Slug (URL) |
|------------|------------|
| About Us | about |
| Contact | contact |
| FAQ | faq |
| Help | help |
| Order Status | order-status |
| Services | services |
| FFL Transfers | ffl-transfers |
| Gunsmithing | gunsmithing |
| Terms & Conditions | terms |
| Privacy Policy | privacy |
| Returns | returns |
| State Restrictions | state-restrictions |
| Firearm Transfer Guide | firearm-transfer-guide |
| **Shop By Brand** | **brands** |

**Tip:** When creating each page, set the permalink/slug to match the "Slug" column. WordPress will automatically use the matching page template (e.g. `page-about.php` for slug "about").

**Shop By Brand:** Create a page with slug `brands`. The theme shows a **grid of brand tiles**; each tile links to that brand's products. Brand data comes from the `pa_brand` product attribute (set by Chattanooga Sync or MGW Populate Filter Attributes). To add brand logos: use a plugin like **Perfect Brands for WooCommerce** or **YITH WooCommerce Brands** to assign images from Media to each brand term. After sync, go to **Settings → Permalinks** and click **Save** to flush rewrite rules.

**If the Brands page shows only a giant image (dead end):** The theme forces the brand tiles template. If you still see the image: (1) Ensure the theme files are deployed to your server. (2) In **Pages → Brands**, clear any image content from the editor and set the template to **Shop By Brand** in Page Attributes. (3) Save Permalinks at **Settings → Permalinks**.

## WooCommerce Setup

1. **Activate WooCommerce** – Plugins → WooCommerce → Activate
2. **Run setup wizard** – Creates Shop, Cart, Checkout, My Account pages
3. **Permalinks** – Settings → Permalinks → Post name (recommended)
4. **Product categories** – Created automatically on theme activation (ammunition, magazines, firearms, etc.)
5. **Shop filters** – Built-in filter sidebar on all shop/category pages: **Search**, **Price** (min/max), **Brand** (from Chattanooga Manufacturer), **Category** (subcategories), **Show Only In Stock**, **Sort By**. No widget setup required. To enable Brand filtering, run **Chattanooga Sync** (brands are imported from CSV Manufacturer column)

### Theme behavior (ecommerce-style)

- **Product pages**: Clean layout with image, title, price, and **Add to Cart** only (no tabs, related products)
- **Cart page**: Prominent **Proceed to Checkout** button; age verification required when cart contains ammunition or firearms
- **Age gate**: Checkout-only verification (no site-wide gate); users must confirm age 21+ and state restrictions before proceeding

## GunTab Payment (Firearms & Ammunition Compliant)

**GunTab is required** for compliant firearm and ammunition payments. See **[GUNTAB-SETUP.md](./GUNTAB-SETUP.md)** for full setup.

Quick steps:
1. Install & activate **GunTab Payment Gateway** plugin
2. **WooCommerce → Settings → Payments** → Enable GunTab, add API token
3. Configure webhook URL in your GunTab account
4. Ensure Cart and Checkout pages are set in **WooCommerce → Settings → Advanced → Page setup**

## Chattanooga Product Sync

1. Go to **Settings → Chattanooga Sync**
2. Enter your **API SID** and **API Token** (from your `.env` or Chattanooga dashboard)
3. Click **Sync Now** to pull the **full product feed CSV** from the Chattanooga API
4. The CSV includes: SKU, Name, Price, Category, **Image Location** (URL), Quantity, Description, Manufacturer
5. Product images use the Image Location URLs from the CSV (Chattanooga CDN) – no download needed
6. Sync runs automatically every 4 hours (WP-Cron)
