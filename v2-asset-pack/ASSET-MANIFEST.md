# Modular Gunworks V2 Asset Manifest

This pack contains the **core visual assets** recovered from the current live site for use in the v2 rebuild.

## Source

All files were downloaded from:

- `https://www.modulargunworks.com/wp-content/themes/modulargunworks/assets/images/...`

## Included assets

### Brand / global

- `images/modular-gunworks-llc.png` (header/home logo)
- `images/Header-flagV2.png` (header background)

### Home category cards

- `images/categories/ammunition.jpg`
- `images/categories/magazines.jpg`
- `images/categories/gear.jpg`
- `images/categories/gun-parts.jpg`
- `images/categories/optics.jpg`
- `images/categories/reloading.jpg`
- `images/categories/outdoors.jpg`
- `images/categories/brands.jpg`

### Theme source references copied for v2

- `source/theme/header.php`
- `source/theme/footer.php`
- `source/theme/front-page.php`
- `source/css/design-system.css`
- `source/css/components.css`
- `source/css/layout.css`

## Referenced but not in this pack

- `images/categories/firearms.jpg` is not currently referenced in theme code (the existing front page maps Firearms to `gear.jpg`).
- Product catalog images are vendor-feed URLs and should be sourced by importer sync, not bundled as theme assets.

## Recommended v2 target paths

Copy into your v2 theme as:

- `wp-content/themes/modulargunworks-v2/assets/images/modular-gunworks-llc.png`
- `wp-content/themes/modulargunworks-v2/assets/images/Header-flagV2.png`
- `wp-content/themes/modulargunworks-v2/assets/images/categories/*.jpg`

## Notes

- Keep these filenames unchanged to avoid touching existing template/CSS references.
- Add optional optimized WebP versions later; do not replace originals until parity is verified.
