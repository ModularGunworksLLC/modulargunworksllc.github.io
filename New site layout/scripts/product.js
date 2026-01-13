// Modular Gunworks LLC - Product Detail Page JS

document.addEventListener('DOMContentLoaded', () => {
  renderHeader();
  renderFooter();
  renderProductDetail();
});

function renderProductDetail() {
  const main = document.getElementById('main-content');
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');
  if (!id) {
    main.innerHTML = '<div class="card">Product not found.</div>';
    return;
  }
  fetch('../data/products/sample.json')
    .then(res => res.json())
    .then(data => {
      const product = data.products.find(p => p.id == id);
      if (!product) {
        main.innerHTML = '<div class="card">Product not found.</div>';
        return;
      }
      main.innerHTML = renderProductDetailCard(product);
    });
}

function renderProductDetailCard(product) {
  return `
    <div class="card">
      <div class="flex flex-col flex-center">
        <img src="../assets/images/${product.images[0] || 'placeholder.jpg'}" alt="${product.title}" style="max-width:300px;" loading="lazy">
        <h1>${product.brand} ${product.title}</h1>
        <div class="small">SKU: ${product.sku} | UPC: ${product.upc}</div>
        <div class="text-primary" style="font-size:2rem;">$${product.price.toFixed(2)}</div>
        <div>${product.in_stock ? '<span class="text-success">In Stock</span>' : '<span class="text-error">Out of Stock</span>'}</div>
        <div class="small">${product.category} | ${product.subcategory}</div>
        <div class="small">${Object.entries(product.attributes).map(([k,v]) => `${capitalize(k)}: ${v}`).join(' | ')}</div>
        <p>${product.description}</p>
        ${product.ffl_required ? '<div class="text-warning">FFL Required for purchase.</div>' : ''}
        ${product.restricted_states && product.restricted_states.length ? `<div class="text-error">Not available in: ${product.restricted_states.join(', ')}</div>` : ''}
        <button class="button" onclick="alert('PayPal integration coming soon!')">Buy with PayPal</button>
      </div>
    </div>
  `;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
