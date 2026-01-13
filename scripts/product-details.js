// product-details.js
// Handles dynamic loading of product details, images, specs, reviews, and sharing for the product details page

// Example: fetch product data by ID from URL
import { loadProducts } from './product-loader.js';

function getProductIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

function setTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  document.querySelectorAll('.tab-content').forEach(content => {
    content.style.display = content.id === 'tab-' + tab ? '' : 'none';
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => setTab(btn.dataset.tab));
  });

  const productId = getProductIdFromUrl();
  if (!productId) return;

  // Load all products (could be optimized to fetch only needed category)
  const { items } = await loadProducts({});
  const product = items.find(p => String(p.sku || p.id) === productId);
  if (!product) return;

  // Populate product info
  document.getElementById('product-title').textContent = product.name;
  document.getElementById('product-brand').textContent = product.brand || '';
  document.getElementById('product-price').textContent = product.price ? `$${product.price.toFixed(2)}` : '';
  document.getElementById('product-description').textContent = product.description || '';
  document.getElementById('product-stock').textContent = product.stock > 0 ? 'In Stock' : 'Out of Stock';

  // Gallery
  const gallery = document.getElementById('product-gallery');
  gallery.innerHTML = '';
  if (product.images && product.images.length) {
    product.images.forEach(img => {
      const el = document.createElement('img');
      el.src = img;
      el.alt = product.name;
      el.className = 'product-gallery-img';
      gallery.appendChild(el);
    });
  } else if (product.image) {
    const el = document.createElement('img');
    el.src = product.image;
    el.alt = product.name;
    el.className = 'product-gallery-img';
    gallery.appendChild(el);
  }

  // Specs
  const specsTable = document.getElementById('product-specs-table');
  if (product.specs) {
    specsTable.innerHTML = Object.entries(product.specs).map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join('');
  }

  // Reviews (placeholder)
  document.getElementById('product-reviews').textContent = 'No reviews yet.';

  // Social sharing
  const url = window.location.href;
  document.getElementById('share-facebook').href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  document.getElementById('share-twitter').href = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(product.name)}`;
  document.getElementById('share-email').href = `mailto:?subject=${encodeURIComponent(product.name)}&body=${encodeURIComponent(url)}`;

  // Cart actions (placeholder)
  document.getElementById('add-to-cart').addEventListener('click', () => alert('Added to cart!'));
  document.getElementById('buy-now').addEventListener('click', () => alert('Proceed to checkout!'));

  // Related products (simple: show 4 others from same category)
  const related = items.filter(p => p.category === product.category && (p.sku || p.id) !== productId).slice(0, 4);
  const relatedGrid = document.getElementById('related-products-grid');
  relatedGrid.innerHTML = related.map(r => `
    <div class="product-card">
      <a href="ammo-product.html?id=${r.sku || r.id}">
        <img src="${r.image || (r.images && r.images[0]) || '/images/no-image.png'}" alt="${r.name}" class="product-card-img">
        <div class="product-card-info">
          <h3>${r.name}</h3>
          <div class="product-card-price">$${r.price ? r.price.toFixed(2) : ''}</div>
        </div>
      </a>
    </div>
  `).join('');
});
