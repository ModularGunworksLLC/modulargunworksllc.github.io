// Modular Gunworks LLC - Category Page JS
// Loads products, filters, sorting, and pagination for a category

document.addEventListener('DOMContentLoaded', () => {
  renderHeader();
  renderFooter();
  renderCategoryPage();
});

function renderCategoryPage() {
  const main = document.getElementById('main-content');
  const urlParams = new URLSearchParams(window.location.search);
  const cat = urlParams.get('cat') || 'firearms';
  main.innerHTML = `
    <div class="flex">
      <aside class="filter-panel" id="filter-panel"></aside>
      <section style="flex:1;">
        <div class="flex flex-center" style="justify-content: space-between;">
          <h1 class="section-title">${capitalize(cat.replace(/-/g, ' '))}</h1>
          <select id="sort-select">
            <option value="relevance">Sort: Relevance</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="newest">Newest</option>
          </select>
        </div>
        <div id="subcategory-list"></div>
        <div id="product-grid" class="product-grid"></div>
        <div id="pagination"></div>
      </section>
    </div>
  `;
  loadCategoryProducts(cat);
}

function loadCategoryProducts(cat) {
  // Load both main and NcStar products, merge, and filter by category
  Promise.all([
    fetch('../data/products/sample.json').then(res => res.json()),
    fetch('../data/products/ncstar.json').then(res => res.json())
  ]).then(([mainData, ncstarData]) => {
    // Merge all products
    const allProducts = [...(mainData.products || []), ...(ncstarData.products || [])];
    // Filter by category (case-insensitive)
    let products = allProducts.filter(p => (p.category || '').toLowerCase() === cat.toLowerCase());
    renderFilters(products, allProducts, cat);
    renderSubcategories(cat);
    renderProductGrid(products);
    // Add filter event listeners
    document.querySelectorAll('input[name="brand"]').forEach(cb => {
      cb.addEventListener('change', () => applyFilters(allProducts, cat));
    });
    const priceRange = document.getElementById('price-range');
    if (priceRange) {
      priceRange.addEventListener('input', () => applyFilters(allProducts, cat));
    }
  });
}

function renderFilters(products, allProducts, cat) {
  // Render brand and price filters for the current category
  const brands = [...new Set(products.map(p => p.brand))];
  const prices = products.map(p => p.price || 0);
  const minPrice = Math.min(...prices, 0);
  const maxPrice = Math.max(...prices, 5000);
  const filterPanel = document.getElementById('filter-panel');
  filterPanel.innerHTML = `
    <div class="filter-group">
      <label>Brand</label><br>
      ${brands.map(b => `<input type="checkbox" name="brand" value="${b}"> ${b}`).join('<br>')}
    </div>
    <div class="filter-group">
      <label>Price</label><br>
      <input type="range" min="${minPrice}" max="${maxPrice}" step="1" value="${minPrice}" id="price-range">
      <span id="price-value">$${minPrice}+</span>
    </div>
    <!-- Add more filters as needed -->
  `;
  // Update price value display
  const priceRange = document.getElementById('price-range');
  if (priceRange) {
    priceRange.addEventListener('input', () => {
      document.getElementById('price-value').textContent = `$${priceRange.value}+`;
    });
  }
}

function renderSubcategories(cat) {
  // Render subcategories for the current category
  if (typeof CATEGORIES === 'undefined') return;
  const category = CATEGORIES.find(c => c.key === cat);
  const subcatList = document.getElementById('subcategory-list');
  if (!category || !subcatList) return;
  if (!category.subcategories || !category.subcategories.length) {
    subcatList.innerHTML = '';
    return;
  }
  subcatList.innerHTML = `<div class="subcategory-list flex" style="gap:1.5rem; margin:1rem 0;">
    ${category.subcategories.map(sc => `<a href="category.html?cat=${cat}&subcat=${sc.key}" class="subcategory-link">${sc.label}</a>`).join('')}
  </div>`;
}

function applyFilters(allProducts, cat) {
  // Get selected brands
  const checkedBrands = Array.from(document.querySelectorAll('input[name="brand"]:checked')).map(cb => cb.value);
  // Get price range
  const priceRange = document.getElementById('price-range');
  const minPrice = priceRange ? parseFloat(priceRange.value) : 0;
  // Filter products
  let products = allProducts.filter(p => (p.category || '').toLowerCase() === cat.toLowerCase());
  if (checkedBrands.length) {
    products = products.filter(p => checkedBrands.includes(p.brand));
  }
  products = products.filter(p => (p.price || 0) >= minPrice);
  renderProductGrid(products);
}

function renderProductGrid(products) {
  const grid = document.getElementById('product-grid');
  grid.innerHTML = products.map(renderProductCard).join('');
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
