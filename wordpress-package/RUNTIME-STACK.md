# Runtime stack (reference)

## Custom code in Git

| Path | Role |
|------|------|
| `wordpress-package/modulargunworks/` | Legacy theme (full Woo overrides) |
| `wordpress-package/modulargunworks-shell/` | Greenfield shell theme |

**`wordpress-package/plugins/`** no longer contains `mgw-*` plugins. If you still use Chattanooga sync, crypto polyfill, populate-filter-attributes, sales-tax, or image-count, they must live **only on the server** (or be recovered from an older Git commit).

## Typical third-party plugins (server only)

WooCommerce, Breeze, Contact Form 7, GunTab, MailPoet, etc. — install and version on the host; not all are in Git.
