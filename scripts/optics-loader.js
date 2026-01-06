// optics-loader.js
// Loads optics products from optics-data.json and renders them with filters

const DATA_URL = '../Data/optics-data.json';
let allOptics = [];
let filteredOptics = [];
let currentPage = 1;
const PAGE_SIZE = 24;

// Fetch and initialize
fetch(DATA_URL)
  .then(res => res.json())
  .then(data => {
    // Flatten all brands into one array
    allOptics = Object.values(data).flat();
    renderFilters();
    updatePage();
  });

function renderFilters() {
  // Brand filter
  const brands = [...new Set(allOptics.map(p => p.brand).filter(Boolean))].sort();
  const brandList = document.querySelector('#filter-brand .filter-list');
  brandList.innerHTML = brands.map(b => `<li><label><input type="checkbox" data-brand="${b}"> ${b}</label></li>`).join('');

  // Type filter (auto-detect common types)
  // For now, use static types as in HTML
}

function getActiveFilters() {
  const brands = Array.from(document.querySelectorAll('input[data-brand]:checked')).map(cb => cb.getAttribute('data-brand'));
  const types = Array.from(document.querySelectorAll('input[data-type]:checked')).map(cb => cb.getAttribute('data-type'));
  const mags = Array.from(document.querySelectorAll('input[data-magnification]:checked')).map(cb => cb.getAttribute('data-magnification'));
  const prices = Array.from(document.querySelectorAll('input[data-price]:checked')).map(cb => cb.getAttribute('data-price'));
  const inStock = document.getElementById('filter-in-stock')?.checked;
  return { brands, types, mags, prices, inStock };
}

function applyFilters() {
  const { brands, types, mags, prices, inStock } = getActiveFilters();
  filteredOptics = allOptics.filter(item => {
    // Brand
    if (brands.length && !brands.includes(item.brand)) return false;
    // Type (simple keyword match in name)
    if (types.length && !types.some(t => item.name.toLowerCase().includes(t.toLowerCase()))) return false;
    // Magnification (simple match in name)
    if (mags.length && !mags.some(m => item.name.toLowerCase().includes(m.toLowerCase()))) return false;
    // Price
    if (prices.length) {
      const price = item.msrp || item.price || 0;
      let match = false;
      for (const range of prices) {
        const [min, max] = range.split('-').map(Number);
        if (price >= min && price <= max) match = true;
      }
      if (!match) return false;
    }
    // In stock (not tracked, always true)
    return true;
  });
}

function updatePage() {
  applyFilters();
  const sortBy = document.getElementById('sort-by')?.value || 'featured';
  if (sortBy === 'price-asc') filteredOptics.sort((a, b) => (a.msrp || a.price) - (b.msrp || b.price));
  if (sortBy === 'price-desc') filteredOptics.sort((a, b) => (b.msrp || b.price) - (a.msrp || a.price));

  const total = filteredOptics.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (currentPage > totalPages) currentPage = totalPages;
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filteredOptics.slice(start, start + PAGE_SIZE);

  document.querySelector('.ammo-result-count').textContent = `Showing ${pageItems.length} of ${total} optics`;
  document.querySelector('.page-info').textContent = `Page ${currentPage} of ${totalPages}`;
  document.querySelector('button[data-page="prev"]').disabled = currentPage === 1;
  document.querySelector('button[data-page="next"]').disabled = currentPage === totalPages;

  document.getElementById('ammo-unified-grid').innerHTML = pageItems.map(renderCard).join('');
}

function renderCard(item) {
    // Debug: log image URLs for the first product only
    if (window && typeof window._opticsImageDebug === 'undefined') {
      window._opticsImageDebug = true;
      if (item.images) {
        const encode = p => p ? 'images/' + encodeURIComponent(p).replace(/%2F/g, '/') : '';
        const thumbs = (item.images.thumbnails || []).map(encode);
        const fulls = (item.images.fullsize || []).map(encode);
        console.log('DEBUG optics image paths:', {sku: item.sku, thumbs, fulls});
      } else {
        console.log('DEBUG optics image paths:', {sku: item.sku, images: null});
      }
    }
  // Show MAP as sale price if present, MSRP as main price
  const hasSale = item.map && item.map < item.msrp;
  let imagesHtml = '';
  // Use thumbnails for grid, fullsize for gallery
  if (item.images && (Array.isArray(item.images.thumbnails) || Array.isArray(item.images.fullsize))) {
    // Fallback to fullsize if no thumbs
    const encode = p => p ? '/images/' + encodeURIComponent(p).replace(/%2F/g, '/') : '';
    const thumbsArr = (item.images.thumbnails || []).map(encode);
    const fullsArr = (item.images.fullsize || []).map(encode);
    const mainThumb = thumbsArr[0] || fullsArr[0];
    const mainFull = fullsArr[0] || thumbsArr[0];
    imagesHtml = `
      <div class="ammo-card-gallery">
        <img class="ammo-card-main-img" src="${mainThumb || 'https://via.placeholder.com/300x200/333/fff?text=No+Image'}" alt="${item.name}" loading="lazy" data-fullimg="${mainFull || ''}" onclick="if(this.dataset.fullimg){this.src=this.dataset.fullimg;}" onerror="this.src='https://via.placeholder.com/300x200/333/fff?text=No+Image'">
        <div class="ammo-card-thumbnails">
          ${(thumbsArr.length ? thumbsArr : fullsArr).map((thumb, idx) => {
            const full = fullsArr[idx] || fullsArr[0] || thumb;
            return `<img src="${thumb}" alt="${item.name} image ${idx+1}" loading="lazy" class="ammo-card-thumb" onclick=\"this.closest('.ammo-card-gallery').querySelector('.ammo-card-main-img').src='${full}'\" onerror=\"this.src='https://via.placeholder.com/60x40/333/fff?text=No+Img'\">`;
          }).join('')}
        </div>
      </div>
    `;
  } else {
    imagesHtml = `<img class="ammo-card-main-img" src="https://via.placeholder.com/300x200/333/fff?text=No+Image" alt="${item.name}" loading="lazy">`;
  }
  return `
    <article class="ammo-card">
      ${imagesHtml}
      <div class="ammo-card-body">
        <h3 class="ammo-card-title">${item.name}</h3>
        <div class="ammo-card-brand">${item.brand}</div>
        <div class="ammo-card-meta">SKU: ${item.sku}${item.upc ? ' • UPC: ' + item.upc : ''}</div>
        <div class="ammo-card-price">
          ${hasSale ? `<span class="ammo-price-main" style="color:#d60000;">$${item.map.toFixed(2)}</span> <span class="ammo-price-sub" style="text-decoration:line-through;">$${item.msrp.toFixed(2)}</span>` : `<span class="ammo-price-main">$${item.msrp ? item.msrp.toFixed(2) : item.price.toFixed(2)}</span>`}
        </div>
        <button class="ammo-card-button" onclick="addToCart('${item.sku}')">ADD TO CART</button>
      </div>
    </article>
  `;
}

// Pagination
const prevBtn = document.querySelector('button[data-page="prev"]');
const nextBtn = document.querySelector('button[data-page="next"]');
if (prevBtn && nextBtn) {
  prevBtn.addEventListener('click', () => { if (currentPage > 1) { currentPage--; updatePage(); } });
  nextBtn.addEventListener('click', () => { currentPage++; updatePage(); });
}
// Filter listeners
['filter-brand', 'filter-type', 'filter-magnification', 'filter-price', 'filter-stock'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('change', () => { currentPage = 1; updatePage(); });
});
document.getElementById('sort-by')?.addEventListener('change', () => { updatePage(); });

// Dummy addToCart
function addToCart(sku) {
  alert('Added ' + sku + ' to cart! (Demo)');
}
