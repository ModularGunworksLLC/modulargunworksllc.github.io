# WordPress / WooCommerce Setup Verification

Use this checklist to ensure the Modular Gunworks WordPress site is configured correctly.

## Theme & Plugins

- [ ] **Modular Gunworks** theme activated (Appearance → Themes)
- [ ] **WooCommerce** installed and activated (Plugins)
- [ ] **MGW Chattanooga Sync** plugin installed and activated (Plugins)

## WooCommerce Configuration

- [ ] Run WooCommerce setup wizard (creates Shop, Cart, Checkout, My Account pages)
- [ ] Permalinks set to "Post name" (Settings → Permalinks)
- [ ] Product categories exist (ammunition, magazines, firearms, gun-parts, gear, optics, reloading, outdoors, brands) — created on theme activation

## Chattanooga Product Sync

- [ ] API credentials in **Settings → Chattanooga Sync** (or in wp-config.php: `MGW_CHATTANOOGA_API_SID`, `MGW_CHATTANOOGA_API_TOKEN`)
- [ ] Click **Sync Now** to pull full CSV from Chattanooga API
- [ ] CSV includes: SKU, Price, Category, **Image Location** (URL), Quantity, Description
- [ ] Products appear in WooCommerce with images from Chattanooga CDN

## Page Setup

Create these pages (Pages → Add New) with the slug shown:

| Page Title | Slug |
|------------|------|
| State Restrictions | state-restrictions |
| Firearm Transfer Guide | firearm-transfer-guide |
| About Us | about |
| Contact | contact |
| FAQ | faq |
| Terms & Conditions | terms |
| Privacy Policy | privacy |

## Functional Verification

### Shop Filters (Like modulargunworks.com / ammodepot.com)

- [ ] Filter sidebar always visible on Shop and Category pages
- [ ] **Search** – Product search
- [ ] **Price** – Min/max price range
- [ ] **Brand** – Filter by manufacturer (after Chattanooga sync)
- [ ] **Category** – Subcategory links
- [ ] **Show Only In Stock** – Toggle
- [ ] **Sort By** – Price, popularity, newest, etc.
- [ ] Apply Filters button submits and updates product grid

### Product Pages

- [ ] Product pages show: image, title, price, **Add to Cart** only (no tabs, related products)
- [ ] Product images load from Chattanooga CDN when synced
- [ ] Add to Cart works (AJAX)

### Cart Page

- [ ] Cart shows items with images
- [ ] **Proceed to Checkout** button is prominent
- [ ] When cart contains **ammunition** or **firearms**: age verification block appears
- [ ] Checkout button disabled until user checks: "Yes, I am 21 or older" + state restrictions acknowledgment
- [ ] For firearms: two additional checkboxes (FFL transfer, transfer guide) required

### Age Gate (Checkout Only)

- [ ] No site-wide age gate (browsing is open)
- [ ] Age verification only at cart/checkout when cart has age-restricted items

### Firearm / FFL Compliance (Industry Standard)

- [ ] **Firearms category page**: FFL notice banner (must ship to licensed FFL)
- [ ] **Firearm product cards**: "FFL Required" badge visible
- [ ] **Single product (firearms)**: Prominent FFL notice before Add to Cart
- [ ] **Add to cart**: Notice appears when adding firearm ("must ship to FFL")
- [ ] **Cart**: When firearms in cart, explicit FFL acknowledgment required (cannot receive at home)
- [ ] **Checkout**: FFL notice when order contains firearms; state compliance notice for all orders

## Payment Gateway

- [ ] GunTab or other payment gateway configured (WooCommerce → Settings → Payments)
