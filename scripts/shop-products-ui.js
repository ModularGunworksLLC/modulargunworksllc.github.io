// scripts/shop-products-ui.js
// Shared shop UI for all category pages — filters, search, pagination, product links (industry-style).
// Requires: load-products.js (sets window.allProducts and calls onProductsLoaded).

(function () {
  const PRODUCTS_PER_PAGE = 24;
  const INITIAL_FILTER_ITEMS = 10;

  let gridView, listView, productCountEl, totalCountEl, viewGridBtn, viewListBtn;
  let filterInputs = {};
  let allProducts = [];
  let filteredProducts = [];
  let currentPage = 1;
  let currentView = 'grid';

  function debounce(fn, ms) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  }

  function getPageCategory() {
    const path = window.location.pathname || '';
    const name = path.split('/').pop() || '';
    return name.replace(/\.html$/i, '') || 'ammunition';
  }

  // --- Ammo: derive caliber, bulletType, grainWeight from name ---
  function extractCaliber(name) {
    const patterns = [
      '.22 LR', '.22 Magnum', '.38 Special', '.357 Magnum', '.40 S&W', '.45 ACP',
      '9mm', '10mm', '.223', '.224', '.243', '.270', '.308', '.30-06', '.300 Win Mag',
      '.300 BLK', '.300 Blackout', '5.56', '5.56 NATO', '7.62x39', '7.62x54', '12 Gauge', '20 Gauge',
      '410', '.45-70', '6.5 Creedmoor', '6mm ARC', '.556 NATO'
    ];
    if (!name || typeof name !== 'string') return '';
    const u = name.toUpperCase();
    for (const p of patterns) {
      if (u.includes(p.toUpperCase())) return p;
    }
    return '';
  }

  function extractBulletType(name) {
    const map = {
      'FMJ': ['FMJ', 'Full Metal Jacket'],
      'JHP': ['JHP', 'Jacketed Hollow Point'],
      'HP': ['Hollow Point', ' HP'],
      'Soft Point': ['Soft Point', 'SP'],
      'BTHP': ['BTHP', 'Boat Tail'],
      'Round Nose': ['Round Nose', 'LRN'],
      'Buckshot': ['Buck', 'Buckshot'],
      'Slug': ['Slug'],
    };
    if (!name || typeof name !== 'string') return '';
    const u = name.toUpperCase();
    for (const [type, patterns] of Object.entries(map)) {
      for (const p of patterns) {
        if (u.includes(p.toUpperCase())) return type;
      }
    }
    return '';
  }

  function extractGrainWeight(name) {
    const m = (name || '').match(/(\d+)\s*(?:gr|grain)/i);
    return m ? m[1] + 'gr' : '';
  }

  // --- Magazines: derive caliber + capacity from name ---
  function extractCapacity(name) {
    const m = (name || '').match(/(\d+)\s*(?:rd|round|capacity|\/)/i);
    return m ? m[1] + 'rd' : '';
  }

  // --- Gear / Optics / Outdoors / Reloading / Gun Parts: derived types ---
  function extractGearType(name) {
    const typePatterns = {
      'Holster': ['holster', 'holsters'],
      'Vest': ['vest', 'carrier', 'plate carrier'],
      'Backpack': ['backpack', 'pack', 'tactical pack'],
      'Pouch': ['pouch', 'pouches', 'mag pouch'],
      'Sling': ['sling', 'strap'],
      'Plate Carrier': ['plate', 'plate carrier'],
      'Belt': ['belt', 'tactical belt'],
      'Flashlight': ['flashlight', 'light', 'torch'],
      'Knife': ['knife', 'blade'],
      'Tool': ['tool', 'multi-tool']
    };
    const nameLower = (name || '').toLowerCase();
    for (const [type, patterns] of Object.entries(typePatterns)) {
      for (const pattern of patterns) {
        if (nameLower.includes(pattern)) return type;
      }
    }
    return 'Other Gear';
  }

  function extractOpticsType(name) {
    const typePatterns = {
      'Red Dot': ['red dot', 'holosun', 'eotech'],
      'Scope': ['scope', 'riflescope'],
      'Iron Sights': ['iron sight', 'iron sights', 'irons'],
      'Magnifier': ['magnifier', '3x', '5x'],
      'Holographic': ['holographic', 'hologram']
    };
    const nameLower = (name || '').toLowerCase();
    for (const [type, patterns] of Object.entries(typePatterns)) {
      for (const pattern of patterns) {
        if (nameLower.includes(pattern)) return type;
      }
    }
    return 'Other Optics';
  }

  function extractOutdoorsType(productName) {
    const name = (productName || '').toLowerCase();
    if (name.includes('knife') || name.includes('blade') || name.includes('fixed')) return 'Knife';
    if (name.includes('flashlight') || name.includes('light') || name.includes('torch')) return 'Flashlight';
    if (name.includes('water') || name.includes('filter') || name.includes('hydration')) return 'Water';
    if (name.includes('food') || name.includes('ration') || name.includes('bar') || name.includes('nutrition')) return 'Food';
    if (name.includes('rope') || name.includes('paracord') || name.includes('cordage')) return 'Rope';
    if (name.includes('kit') || name.includes('set') || name.includes('pack')) return 'Kit';
    if (name.includes('first aid') || name.includes('medical') || name.includes('trauma')) return 'Medical';
    if (name.includes('fire') || name.includes('starter') || name.includes('match')) return 'Fire Starter';
    if (name.includes('tent') || name.includes('shelter') || name.includes('tarp')) return 'Shelter';
    if (name.includes('backpack') || name.includes('bag') || name.includes('pack')) return 'Backpack';
    if (name.includes('compass') || name.includes('map')) return 'Navigation';
    if (name.includes('whistle')) return 'Whistle';
    return 'Other';
  }

  function extractOutdoorsAmmoType(productName) {
    const name = (productName || '').toLowerCase();
    if (name.includes('.22') || name.includes('rimfire') || name.includes('lr')) return 'Rimfire';
    if (name.includes('shotgun') || name.includes('12ga') || name.includes('20ga') || name.includes('410')) return 'Shotgun';
    if (name.includes('hunting') || name.includes('rifle') || name.includes('magnum') || name.includes('winchester')) return 'Hunting';
    return 'Other';
  }

  function extractReloadingType(productName) {
    const name = (productName || '').toLowerCase();
    if (name.includes('powder')) return 'Powder';
    if (name.includes('primer') || name.includes('cap')) return 'Primers';
    if (name.includes('bullet') || name.includes('projectile')) return 'Bullets';
    if (name.includes('case') || name.includes('brass')) return 'Cases';
    if (name.includes('press') || name.includes('loader')) return 'Press';
    if (name.includes('die')) return 'Dies';
    if (name.includes('scale') || name.includes('balance')) return 'Scale';
    if (name.includes('tumbler') || name.includes('polisher')) return 'Tumbler';
    if (name.includes('trimmer') || name.includes('trim')) return 'Trimmer';
    if (name.includes('calipers') || name.includes('measure')) return 'Calipers';
    if (name.includes('press plate') || name.includes('shell holder')) return 'Accessories';
    return 'Other';
  }

  function extractReloadingCaliber(productName) {
    const calibers = [
      '9mm', '9x19', '.38 Special', '.357 Magnum', '.44 Magnum', '.45 ACP', '.45 Colt',
      '.40 S&W', '10mm', '.380', '.32 ACP', '.22 LR', '.22-250', '.223', '5.56', '.243 Win',
      '6.5 Creedmoor', '.270 Win', '.308 Win', '7.62', '.30-06', '7.62x39', '.300 Win Mag',
      '.338 Lapua', '.375 H&H', '.458 Win'
    ];
    const name = (productName || '').toLowerCase();
    for (const cal of calibers) {
      if (name.includes(cal.toLowerCase())) return cal;
    }
    return '';
  }

  function extractGunPartsType(name) {
    const types = [
      'Upper', 'Lower', 'Bcg', 'Bolt Carrier', 'Trigger', 'Stock', 'Handguard',
      'Barrel', 'Gas', 'Fcg', 'Rail', 'Muzzle', 'Buffer'
    ];
    const nameLower = (name || '').toLowerCase();
    for (const type of types) {
      if (nameLower.includes(type.toLowerCase())) return type;
    }
    return '';
  }

  function extractGunPartsCaliber(name) {
    const calibers = ['9mm', '.40', '.45', '10mm', '5.56', '.308', '7.62', '12ga', '.22'];
    const nameLower = (name || '').toLowerCase();
    for (const cal of calibers) {
      if (nameLower.includes(cal.toLowerCase())) return cal;
    }
    return '';
  }

  function normalizeProductFields(product) {
    return {
      ...product,
      manufacturer: product.manufacturer || product.brand || '',
      caliber: product.caliber || product.calibre || ''
    };
  }

  function enrichGearProducts(products) {
    return products.map(p => ({
      ...p,
      type: p.type || extractGearType(p.name)
    }));
  }

  function enrichOpticsProducts(products) {
    return products.map(p => ({
      ...p,
      type: p.type || extractOpticsType(p.name)
    }));
  }

  function enrichOutdoorsProducts(products) {
    return products.map(p => ({
      ...p,
      type: p.type || extractOutdoorsType(p.name),
      ammoType: p.ammoType || extractOutdoorsAmmoType(p.name)
    }));
  }

  function enrichReloadingProducts(products) {
    return products.map(p => ({
      ...p,
      type: p.type || extractReloadingType(p.name),
      caliber: p.caliber || extractReloadingCaliber(p.name)
    }));
  }

  function enrichGunPartsProducts(products) {
    return products.map(p => ({
      ...p,
      type: p.type || extractGunPartsType(p.name),
      caliber: p.caliber || extractGunPartsCaliber(p.name)
    }));
  }

  function enrichMagazineProducts(products) {
    return products.map(p => ({
      ...p,
      caliber: p.caliber || extractCaliber(p.name),
      capacity: p.capacity || extractCapacity(p.name),
    }));
  }

  function enrichAmmoProducts(products) {
    return products.map(p => ({
      ...p,
      caliber: p.caliber || extractCaliber(p.name),
      bulletType: p.bulletType || extractBulletType(p.name),
      grainWeight: p.grainWeight || extractGrainWeight(p.name),
    }));
  }

  // --- Populate filter lists from products ---
  function unique(arr) {
    return [...new Set(arr)].filter(Boolean).sort();
  }

  function populateFilterList(containerId, values, checkboxClass) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    values.forEach((value, index) => {
      const div = document.createElement('div');
      div.className = 'filter-option' + (index >= INITIAL_FILTER_ITEMS ? ' hidden-item' : '');
      const id = `${containerId}-${index}-${(value + '').replace(/\s/g, '_')}`;
      div.innerHTML = `
        <label style="display: flex; align-items: center; cursor: pointer; gap: 0.5rem; color: #555; font-weight: 500;">
          <input type="checkbox" class="filter-checkbox ${checkboxClass}" value="${(value + '').replace(/"/g, '&quot;')}" id="${id}" />
          ${escapeHtml(value + '')}
        </label>`;
      container.appendChild(div);
    });
    const showMore = container.closest('.filter-section')?.querySelector('.show-more-btn');
    if (showMore) showMore.style.display = values.length > INITIAL_FILTER_ITEMS ? 'block' : 'none';
  }

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function setupFilterPopulations(products) {
    const pageCategory = getPageCategory();
    const hasAmmo = document.getElementById('caliber-list') && (pageCategory === 'ammunition' || document.getElementById('bullet-type-list'));
    const hasMagazine = document.getElementById('capacity-list') || (document.getElementById('caliber-list') && pageCategory === 'magazines');
    let enriched = products.map(normalizeProductFields);
    if (pageCategory === 'gear') enriched = enrichGearProducts(enriched);
    else if (pageCategory === 'optics') enriched = enrichOpticsProducts(enriched);
    else if (pageCategory === 'outdoors') enriched = enrichOutdoorsProducts(enriched);
    else if (pageCategory === 'reloading') enriched = enrichReloadingProducts(enriched);
    else if (pageCategory === 'gun-parts') enriched = enrichGunPartsProducts(enriched);

    if (hasAmmo) enriched = enrichAmmoProducts(enriched);
    else if (hasMagazine) enriched = enrichMagazineProducts(enriched);

    let categories = unique(enriched.flatMap(p => [p.category, p.subcategory].filter(Boolean)));
    // On ammunition page, don't show "Ammunition" in category filter (redundant); only show subcategories (e.g. Handgun, Rifle, Rimfire Ammunition).
    if (pageCategory === 'ammunition' && document.getElementById('category-list')) {
      categories = categories.filter(c => (c || '').toLowerCase() !== 'ammunition');
    }
    const types = unique(enriched.map(p => p.type || p.subcategory || p.category).filter(Boolean));
    const brands = unique(enriched.map(p => p.manufacturer).filter(Boolean));

    if (document.getElementById('category-list')) populateFilterList('category-list', categories, 'category-checkbox');
    if (document.getElementById('type-list')) populateFilterList('type-list', types, 'type-checkbox');
    if (document.getElementById('brand-list')) populateFilterList('brand-list', brands, 'brand-checkbox');
    if (document.getElementById('ammo-type-list')) {
      const ammoTypes = unique(enriched.map(p => p.ammoType).filter(Boolean));
      populateFilterList('ammo-type-list', ammoTypes, 'ammo-type-checkbox');
    }

    if (hasAmmo) {
      const calibers = unique(enriched.map(p => p.caliber).filter(Boolean));
      const bulletTypes = unique(enriched.map(p => p.bulletType).filter(Boolean));
      const grainWeights = unique(enriched.map(p => p.grainWeight).filter(Boolean));
      if (document.getElementById('caliber-list')) populateFilterList('caliber-list', calibers, 'caliber-checkbox');
      if (document.getElementById('bullet-type-list')) populateFilterList('bullet-type-list', bulletTypes, 'bullet-type-checkbox');
      if (document.getElementById('grain-weight-list')) populateFilterList('grain-weight-list', grainWeights, 'grain-weight-checkbox');
    }
    if (hasMagazine && document.getElementById('capacity-list')) {
      const capacities = unique(enriched.map(p => p.capacity).filter(Boolean));
      populateFilterList('capacity-list', capacities, 'capacity-checkbox');
    }
    if (hasMagazine && document.getElementById('caliber-list') && !hasAmmo) {
      const calibers = unique(enriched.map(p => p.caliber).filter(Boolean));
      populateFilterList('caliber-list', calibers, 'caliber-checkbox');
    }
    if (!hasAmmo && !hasMagazine && document.getElementById('caliber-list')) {
      const calibers = unique(enriched.map(p => p.caliber).filter(Boolean));
      populateFilterList('caliber-list', calibers, 'caliber-checkbox');
    }

    const priceMinEl = document.getElementById('price-min');
    const priceMaxEl = document.getElementById('price-max');
    if (priceMinEl && enriched.length) {
      const prices = enriched.map(p => p.displayPrice ?? 0).filter(n => typeof n === 'number' && !isNaN(n) && n > 0);
      if (prices.length) {
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        if (!priceMinEl.placeholder) priceMinEl.placeholder = '$' + min.toFixed(0);
        if (priceMaxEl && !priceMaxEl.placeholder) priceMaxEl.placeholder = '$' + max.toFixed(0);
      }
    }

    return enriched;
  }

  function setupDOM() {
    gridView = document.getElementById('grid-view');
    listView = document.getElementById('list-view');
    productCountEl = document.getElementById('product-count');
    totalCountEl = document.getElementById('total-count');
    viewGridBtn = document.getElementById('view-grid');
    viewListBtn = document.getElementById('view-list');
    filterInputs.priceMin = document.getElementById('price-min');
    filterInputs.priceMax = document.getElementById('price-max');
    filterInputs.inStock = document.getElementById('in-stock-filter');
    filterInputs.sort = document.getElementById('sort-filter');
    filterInputs.search = document.getElementById('product-search') || document.querySelector('.product-search');
    filterInputs.onSale = document.getElementById('on-sale-filter');
  }

  function getSelectedFilterValues(className) {
    return Array.from(document.querySelectorAll(`.${className}:checked`)).map(cb => cb.value);
  }

  function applyFilters(products) {
    let result = products.slice();

    const selectedCategories = getSelectedFilterValues('category-checkbox');
    if (selectedCategories.length) {
      result = result.filter(p =>
        selectedCategories.includes(p.category) || selectedCategories.includes(p.subcategory)
      );
    }

    const selectedTypes = getSelectedFilterValues('type-checkbox');
    if (selectedTypes.length) {
      result = result.filter(p => selectedTypes.includes(p.type || p.subcategory || p.category));
    }

    const selectedBrands = getSelectedFilterValues('brand-checkbox');
    if (selectedBrands.length) {
      result = result.filter(p => selectedBrands.includes(p.manufacturer));
    }

    const selectedAmmoTypes = getSelectedFilterValues('ammo-type-checkbox');
    if (selectedAmmoTypes.length && result[0] && 'ammoType' in result[0]) {
      result = result.filter(p => selectedAmmoTypes.includes(p.ammoType));
    }

    const selectedCalibers = getSelectedFilterValues('caliber-checkbox');
    if (selectedCalibers.length && result[0] && 'caliber' in result[0]) {
      result = result.filter(p => selectedCalibers.includes(p.caliber));
    }

    const selectedBulletTypes = getSelectedFilterValues('bullet-type-checkbox');
    if (selectedBulletTypes.length && result[0] && 'bulletType' in result[0]) {
      result = result.filter(p => selectedBulletTypes.includes(p.bulletType));
    }

    const selectedGrainWeights = getSelectedFilterValues('grain-weight-checkbox');
    if (selectedGrainWeights.length && result[0] && 'grainWeight' in result[0]) {
      result = result.filter(p => selectedGrainWeights.includes(p.grainWeight));
    }

    const selectedCapacities = getSelectedFilterValues('capacity-checkbox');
    if (selectedCapacities.length && result[0] && 'capacity' in result[0]) {
      result = result.filter(p => selectedCapacities.includes(p.capacity));
    }

    if (document.getElementById('on-sale-filter')?.checked) {
      result = result.filter(p => {
        const sellPrice = p.price ?? 0;
        const listPrice = p.displayPrice ?? 0;
        return listPrice > 0 && sellPrice < listPrice;
      });
    }

    const min = parseFloat(filterInputs.priceMin?.value) || 0;
    const max = parseFloat(filterInputs.priceMax?.value) || Infinity;
    result = result.filter(p => {
      const dp = p.displayPrice ?? 0;
      return dp >= min && dp <= max;
    });

    if (filterInputs.inStock?.checked) {
      result = result.filter(p => p.inventory > 0);
    }

    const searchTerm = (filterInputs.search?.value || '').trim().toLowerCase();
    if (searchTerm) {
      result = result.filter(p =>
        (p.name || '').toLowerCase().includes(searchTerm) ||
        (p.sku || '').toLowerCase().includes(searchTerm) ||
        (p.manufacturer || '').toLowerCase().includes(searchTerm)
      );
    }

    const sortVal = filterInputs.sort?.value || 'newest';
    const getDisplayPrice = p => p.displayPrice ?? 0;
    if (sortVal === 'price-low') result.sort((a, b) => getDisplayPrice(a) - getDisplayPrice(b));
    else if (sortVal === 'price-high') result.sort((a, b) => getDisplayPrice(b) - getDisplayPrice(a));
    else if (sortVal === 'name') result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    else result = result; // newest / default: keep load order (top brands first from load-products.js)

    return result;
  }

  function productDetailUrl(product) {
    const category = getPageCategory();
    const base = window.location.pathname.includes('/shop/') ? '../product-detail.html' : 'product-detail.html';
    return `${base}?sku=${encodeURIComponent(product.sku || '')}&category=${encodeURIComponent(category)}`;
  }

  function renderProductCard(product) {
    const url = productDetailUrl(product);
    const displayPrice = product.displayPrice ?? 0;
    const priceNum = displayPrice != null && !isNaN(displayPrice) ? displayPrice : 0;
    const price = priceNum.toFixed(2);
    const inStock = product.inventory > 0;
    const nameEsc = (product.name || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
    const imgEsc = (product.image || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
    const category = getPageCategory();
    const imgHtml = product.image
      ? '<img src="' + (product.image.replace(/"/g, '&quot;')) + '" alt="' + escapeHtml(product.name || '') + '" loading="lazy">'
      : '<div class="product-image-placeholder"><i class="fas fa-box"></i></div>';
    return '<div class="product-card">' +
      '<a href="' + url + '" class="product-card-link" style="text-decoration: none; color: inherit; display: flex; flex-direction: column; flex: 1;">' +
        '<div class="product-image">' + imgHtml + '</div>' +
        '<div class="product-info">' +
          '<div class="product-brand">' + (escapeHtml(product.manufacturer || '') || 'Unknown') + '</div>' +
          '<div class="product-name">' + escapeHtml(product.name || '') + '</div>' +
          '<div class="product-pricing">' +
            '<div class="product-price">$' + price + '</div>' +
            '<div class="product-stock ' + (inStock ? 'stock-in' : 'stock-out') + '">' + (inStock ? 'In Stock' : 'Out of Stock') + '</div>' +
          '</div>' +
        '</div>' +
      '</a>' +
      '<button class="product-btn" onclick="event.preventDefault(); event.stopPropagation(); addToCart(\'' + (product.sku || '').replace(/'/g, "\\'") + '\', \'' + nameEsc + '\', ' + priceNum + ', 1, \'' + imgEsc + '\', \'' + category + '\')">' +
        '<i class="fas fa-cart-plus"></i> Add to Cart' +
      '</button>' +
    '</div>';
  }

  function renderProducts(products, append) {
    const start = (currentPage - 1) * PRODUCTS_PER_PAGE;
    const slice = products.slice(start, start + PRODUCTS_PER_PAGE);
    const hasMore = start + slice.length < products.length;

    if (!gridView) return;

    if (!append) gridView.innerHTML = '';
    const html = slice.map(p => renderProductCard(p)).join('');
    if (append) gridView.insertAdjacentHTML('beforeend', html);
    else gridView.innerHTML = html;

    let loadMoreEl = document.getElementById('shop-load-more');
    if (loadMoreEl) loadMoreEl.remove();
    if (hasMore && !append) {
      const wrap = document.createElement('div');
      wrap.id = 'shop-load-more';
      wrap.style.cssText = 'grid-column: 1 / -1; text-align: center; padding: 2rem;';
      wrap.innerHTML = `<button type="button" class="product-btn" id="btn-load-more" style="max-width: 280px;">Load more products</button>`;
      gridView.appendChild(wrap);
      const btn = document.getElementById('btn-load-more');
      if (btn) {
        btn.onclick = () => {
          currentPage++;
          renderProducts(filteredProducts, true);
        };
      }
    }

    if (productCountEl) productCountEl.textContent = filteredProducts.length;
    if (totalCountEl) totalCountEl.textContent = allProducts.length;

    const listBody = document.getElementById('list-body');
    if (listView && listBody) {
      if (products.length === 0) {
        listBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem; color: #999;">No products found.</td></tr>';
      } else {
        const category = getPageCategory();
        const rows = products.map(p => {
        const dp = p.displayPrice ?? 0;
        const priceNum = (dp != null && !isNaN(dp)) ? dp : 0;
          const price = priceNum.toFixed(2);
          const url = productDetailUrl(p);
          const imgEsc = (p.image || '').replace(/'/g, "\\'");
          return `
            <tr>
              <td><a href="${url}" style="color: var(--color-bg-dark, #181a1b); font-weight: 600;">${escapeHtml(p.name || '')}</a></td>
              <td>${escapeHtml(p.manufacturer || '')}</td>
              <td class="product-price-list">$${price}</td>
              <td><span class="${p.inventory > 0 ? 'stock-in' : 'stock-out'}">${p.inventory > 0 ? 'In Stock' : 'Out of Stock'}</span></td>
              <td><button type="button" class="product-btn" style="padding: 0.4rem 0.8rem;" onclick="addToCart('${(p.sku || '').replace(/'/g, "\\'")}', '${(p.name || '').replace(/'/g, "\\'")}', ${priceNum}, 1, '${imgEsc}', '${category}')"><i class="fas fa-cart-plus"></i> Add</button></td>
            </tr>`;
        }).join('');
        listBody.innerHTML = rows;
      }
    }
  }

  function updateView() {
    currentPage = 1;
    filteredProducts = applyFilters(allProducts);
    renderProducts(filteredProducts);
  }

  function setupFilterToggle() {
    document.querySelectorAll('.filter-toggle').forEach(btn => {
      btn.addEventListener('click', function () {
        const content = this.nextElementSibling;
        const icon = this.querySelector('i');
        if (!content) return;
        const isVisible = window.getComputedStyle(content).display !== 'none';
        content.style.display = isVisible ? 'none' : 'block';
        if (icon) icon.style.transform = isVisible ? 'rotate(0deg)' : 'rotate(180deg)';
      });
    });
    document.querySelectorAll('.filter-search').forEach(input => {
      input.addEventListener('input', debounce(function () {
        const term = this.value.toLowerCase();
        const list = this.nextElementSibling;
        if (!list) return;
        list.querySelectorAll('.filter-option').forEach(opt => {
          opt.style.display = (opt.textContent || '').toLowerCase().includes(term) ? '' : 'none';
        });
      }, 150));
    });
    document.querySelectorAll('.show-more-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        const section = this.closest('.filter-section');
        const list = section?.querySelector('div[id$="-list"]');
        if (!list) return;
        const hidden = list.querySelectorAll('.hidden-item');
        const wasExpanded = this.dataset.expanded === 'true';
        hidden.forEach(el => {
          el.style.display = wasExpanded ? 'none' : '';
          el.classList.toggle('hidden-item', wasExpanded);
        });
        this.textContent = wasExpanded ? 'Show More' : 'Show Less';
        this.dataset.expanded = wasExpanded ? 'false' : 'true';
      });
    });
    const clearBtn = document.getElementById('clear-filters');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        document.querySelectorAll('.filter-checkbox').forEach(cb => { cb.checked = false; });
        if (filterInputs.priceMin) filterInputs.priceMin.value = '';
        if (filterInputs.priceMax) filterInputs.priceMax.value = '';
        if (filterInputs.inStock) filterInputs.inStock.checked = false;
        if (filterInputs.onSale) filterInputs.onSale.checked = false;
        if (filterInputs.sort) filterInputs.sort.value = 'price-low';
        if (filterInputs.search) filterInputs.search.value = '';
        currentPage = 1;
        updateView();
      });
    }
  }

  function setupEventListeners() {
    const runUpdate = debounce(updateView, 150);
    document.querySelectorAll('.filter-checkbox').forEach(el => el.addEventListener('change', runUpdate));
    [filterInputs.priceMin, filterInputs.priceMax].forEach(el => { if (el) el.addEventListener('input', runUpdate); });
    if (filterInputs.inStock) filterInputs.inStock.addEventListener('change', runUpdate);
    if (filterInputs.onSale) filterInputs.onSale.addEventListener('change', runUpdate);
    if (filterInputs.sort) filterInputs.sort.addEventListener('change', runUpdate);
    if (filterInputs.search) filterInputs.search.addEventListener('input', runUpdate);

    if (viewGridBtn) {
      viewGridBtn.addEventListener('click', () => {
        currentView = 'grid';
        if (gridView) gridView.style.display = 'grid';
        if (listView) listView.style.display = 'none';
        viewGridBtn?.classList?.add('active');
        viewListBtn?.classList?.remove('active');
      });
    }
    if (viewListBtn) {
      viewListBtn.addEventListener('click', () => {
        currentView = 'list';
        if (gridView) gridView.style.display = 'none';
        if (listView) listView.style.display = 'block';
        viewListBtn?.classList?.add('active');
        viewGridBtn?.classList?.remove('active');
      });
    }
  }

  window.onProductsLoaded = function (products) {
    if (!products || !products.length) {
      allProducts = [];
      filteredProducts = [];
      if (gridView) {
        gridView.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:2rem;color:#999;">No products in this category.</div>';
      }
      const listBody = document.getElementById('list-body');
      if (listBody) listBody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem;">No products.</td></tr>';
      return;
    }

    setupDOM();
    allProducts = setupFilterPopulations(products);
    filteredProducts = applyFilters(allProducts);
    currentPage = 1;
    renderProducts(filteredProducts);
    setupFilterToggle();
    setupEventListeners();

    if (gridView) gridView.style.display = 'grid';
    if (listView) listView.style.display = 'none';
  };
})();
