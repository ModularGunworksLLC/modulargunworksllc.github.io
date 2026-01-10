// product-loader.js
// Generic loader for paginated/filterable product data (CSV or API)
// Usage: import and call loadProducts({category, page, pageSize, filters})

import Papa from 'papaparse';
import { loadProductsFromApi } from './api-product-loader.js';


// Map shop page to CSV file
const DATA_MAP = {
  ammunition: 'Data/ammo-data.csv',
  gear: 'Data/gear-data.csv',
  guns: 'Data/guns-data.csv',
  magazines: 'Data/magazines-data.csv',
  optics: 'Data/optics-data.csv',
  reloading: 'Data/reloading-data.csv',
  sale: 'Data/sale-data.csv',
  survival: 'Data/survival-data.csv',
  ncstar: 'Data/ncstar-products.json',
};

// Toggle this to switch between CSV and API
const USE_API = false;

export async function loadProducts({ category, page = 1, pageSize = 20, filters = {} }) {
  if (USE_API) {
    return loadProductsFromApi({ category, page, pageSize, filters });
  }
  const dataUrl = DATA_MAP[category];
  if (!dataUrl) throw new Error('Unknown category: ' + category);
  let data;
  if (dataUrl.endsWith('.json')) {
    const response = await fetch(dataUrl);
    data = await response.json();
  } else {
    const response = await fetch(dataUrl);
    const csvText = await response.text();
    data = Papa.parse(csvText, { header: true }).data;
  }
  // Filter
  let filtered = data;
  for (const key in filters) {
    if (filters[key]) {
      filtered = filtered.filter(item => (item[key] || '').toLowerCase() === String(filters[key]).toLowerCase());
    }
  }
  // Pagination
  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const pageItems = filtered.slice(start, end);
  return { items: pageItems, total, page, pageSize };
}

// Example usage in a shop page script:
// import { loadProducts } from './product-loader.js';
// loadProducts({ category: 'ammunition', page: 1, pageSize: 20, filters: { caliber: '9mm' } })
//   .then(({ items, total }) => renderProductList(items));
