# Production runtime stack (reference)

**Site:** WordPress on AWS Lightsail (Bitnami). This file lists **installed** components as of inventory **2026-04-08**. Versions are read from plugin `Version:` headers where present; do not treat as a live audit.

## Custom Modular Gun Works (source in this repo)

| Slug / path | Version (header) |
|-------------|------------------|
| Theme: `modulargunworks` | *(style.css in theme)* |
| `mgw-chattanooga-sync` | 1.0.0 |
| `mgw-crypto-polyfill` | 1.0 |
| `mgw-populate-filter-attributes` | 1.0.0 |
| `mgw-sales-tax` | 1.0 |
| `mgw-image-count` (Product Image Count) | 1.2 |

`mgw-force-cart-checkout` and `guntab-payment-gateway` / `wpgetapi`: check main plugin file for version line if needed.

## Third-party / vendor (not in this Git repo)

Install via WordPress.org, Composer, or vendor zips on the server only.

| Plugin | Version (approx.) |
|--------|-------------------|
| WooCommerce | *(see Plugins screen)* |
| WooCommerce Shipping | 2.2.6 |
| WooCommerce Services | 3.5.2 |
| Breeze | 2.4.4 |
| Filter Everything | 1.9.2 |
| Redis Object Cache | 2.7.0 |
| Google Listings and Ads | 3.6.1 |
| Akismet | 5.6 |
| Age Gate | 3.7.2 |
| MailPoet | *(bundle)* |
| WPGetAPI | *(see file)* |
| WPtouch | 4.3.62 |

**Do not commit:** `wp-config.php`, database dumps, `wp-content/uploads/`, full WooCommerce core, or commercial zip contents unless licensing allows vendoring.
