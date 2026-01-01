# AI Coding Agent Instructions for Modular Gunworks LLC Website

## Project Overview
This is a static website for Modular Gunworks LLC, a veteran-owned FFL firearms business. The site uses GitHub Pages with Jekyll for Markdown processing, Python scripts for content generation, and vanilla JavaScript for dynamic product loading.

## Architecture
- **Static HTML/CSS/JS** served via GitHub Pages
- **Jekyll** processes `.md` files in `shop/` and `brands/` into HTML pages
- **Python generators** create brand pages (`brands/a/brand.md`) and category pages (`shop/category.md`)
- **JSON data** in `Data/` loaded dynamically by JS (e.g., `ammo-data.json` for products)
- **Modular structure**: Shared header/navigation across pages, category-specific layouts

## Key Directories & Files
- `index.html`: Homepage with category tiles
- `shop/`: Category pages (mix of `.html` for complex layouts like `ammunition.html`, `.md` for simple like `guns.md`)
- `brands/`: Brand pages organized A-Z (`brands/a/aero-precision.md`)
- `Data/`: JSON data files (e.g., `ammo-data.json` with product arrays by category)
- `scripts/`: JS files (e.g., `ammo-loader.js` loads and filters products)
- `images/`: Static assets, organized by type (`brands/`, `categories/`, `ammo/`)

## Development Workflow
1. **Generate content**: Run Python scripts like `python build_brand_pages.py` to create MD files
2. **Add data**: Update JSON in `Data/` for new products
3. **Test locally**: Use Jekyll serve or open HTML files directly
4. **Deploy**: Push to `main` branch (GitHub Pages auto-deploys)

## Coding Patterns
- **HTML structure**: Consistent header (`<header class="site-header">`) and nav (`<nav class="category-nav">`) across pages
- **Product cards**: Use template literals in JS to build cards from JSON data
- **Slug generation**: `brand.lower().replace(" ", "-").replace("&", "and")` for URLs
- **Data loading**: `fetch("../Data/ammo-data.json").then(data => process(data))`
- **Filtering**: Client-side JS filters products by caliber, brand, price, etc.
- **Theme toggle**: CSS classes (`body.dark-theme`) switched via JS

## Examples
- **Adding a brand**: Run `build_brand_pages.py`, add to brands list, generates `brands/f/fn-america.md`
- **Product data**: Each item in `ammo-data.json` has `id`, `title`, `brand`, `caliber`, `price`, etc.
- **Category page**: `shop/ammunition.html` has static filters sidebar, dynamic grid loaded by `ammo-loader.js`

## Legal Notice
All code is proprietary to Modular Gunworks LLC. Do not copy, reuse, or redistribute without explicit permission.</content>
<parameter name="filePath">c:\Users\micha\modular-gunworks-site\modulargunworksllc.github.io\.github\copilot-instructions.md