// Modular Gunworks LLC - Main JS
// Loads header, footer, homepage sections

document.addEventListener('DOMContentLoaded', () => {
  renderHomepageDynamicSections();
});

// Only render dynamic homepage sections (featured products)
function renderHomepageDynamicSections() {
  loadFeaturedProducts();
}

function loadFeaturedProducts() {
  fetch('../data/products/sample.json')
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById('featured-products');
      if (!container) return;
      container.innerHTML = data.products.slice(0, 4).map(renderProductCard).join('');
    });
}

function renderProductCard(product) {
  return `
    <div class="card">
      <img src="../assets/images/${product.images[0] || 'placeholder.jpg'}" alt="${product.title}" loading="lazy" style="max-height:160px;object-fit:contain;background:#fff;border:1px solid #eee;">
      <h3 style="font-size:1.1rem; font-weight:700; margin:0.5rem 0;">${product.brand} ${product.title}</h3>
      <div class="small">${product.category} | ${product.attributes.caliber || ''}</div>
      <div class="text-primary" style="font-size:1.2rem; font-weight:700;">$${product.price.toFixed(2)}</div>
      <div>${product.in_stock ? '<span class="text-success">In Stock</span>' : '<span class="text-error">Out of Stock</span>'}</div>
      <a href="product.html?id=${product.id}" class="button" style="margin-top:0.5rem;">View Product</a>
    </div>
  `;
}
