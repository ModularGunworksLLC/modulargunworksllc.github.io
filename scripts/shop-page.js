// shop-page.js
// Example: Replace this with the correct category for each shop page
import { loadProducts } from './product-loader.js';

const CATEGORY = 'ammunition'; // Change to match the page (e.g., 'gear', 'guns', etc.)
const PAGE_SIZE = 20;
let currentPage = 1;
let currentFilters = {};

async function renderPage(page = 1, filters = {}) {
  const { items, total } = await loadProducts({ category: CATEGORY, page, pageSize: PAGE_SIZE, filters });
  renderProductList(items);
  renderPagination(total, page, PAGE_SIZE);
}

function renderProductList(items) {
  const container = document.getElementById('product-list');
  container.innerHTML = items.map(item => `<div class="product-card">
    <img src="${item.image || ''}" alt="${item.title || item.name}" />
    <h3>${item.title || item.name}</h3>
    <p>${item.price ? '$' + item.price : ''}</p>
    <!-- Add more fields as needed -->
  </div>`).join('');
}

function renderPagination(total, page, pageSize) {
  // Simple pagination controls (implement as needed)
}

// Example: Hook up filters and pagination controls
// document.getElementById('filter-form').onsubmit = ...
// document.getElementById('next-page').onclick = ...

// Initial load
renderPage(currentPage, currentFilters);
