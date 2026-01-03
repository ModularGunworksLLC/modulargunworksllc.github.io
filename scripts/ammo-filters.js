// ammo-filters.js
// Dynamically generates filter lists and handles filtering logic for ammunition page

(async function() {
  // Utility functions for normalization
  function normalizeBrand(rsrBrand) {
    // Map RSR manufacturer to clean brand name
    if (!rsrBrand) return '';
    const map = {
      'FN AMERICA, LLC': 'FN America',
      'SMITH & WESSON': 'Smith & Wesson',
      'SIG SAUER, INC.': 'SIG Sauer',
      'SPRINGFIELD ARMORY': 'Springfield Armory',
      'HK USA': 'HK',
      'GLOCK, INC.': 'Glock',
      'RUGER & COMPANY INC.': 'Ruger',
      'MAGPUL INDUSTRIES CORP.': 'Magpul',
      // Add more mappings as needed
    };
    return map[rsrBrand.trim().toUpperCase()] || rsrBrand.trim();
  }

  function normalizeCaliber(rsrCaliber) {
    if (!rsrCaliber) return '';
    // Clean up common RSR caliber names
    return rsrCaliber.replace(/\s*REMINGTON/i, ' Remington')
      .replace(/\s*WINCHESTER/i, ' Winchester')
      .replace(/\s*AUTO/i, ' Auto')
      .replace(/\s*ACP/i, ' ACP')
      .replace(/\s*LUGER/i, ' Luger')
      .replace(/\s*MAGNUM/i, ' Magnum')
      .replace(/\s*SPECIAL/i, ' Special')
      .replace(/\s*SHORT/i, ' Short')
      .replace(/\s*LONG/i, ' Long')
      .replace(/\s*SUPER/i, ' Super')
      .replace(/\s*GOVERNMENT/i, ' Government')
      .replace(/\s*RUSSIAN/i, ' Russian')
      .replace(/\s*SWEDISH/i, ' Swedish')
      .replace(/\s*SPRINGFIELD/i, ' Springfield')
      .replace(/\s*WSSM/i, ' WSSM')
      .replace(/\s*WSM/i, ' WSM')
      .replace(/\s*WMR/i, ' WMR')
      .replace(/\s*HMR/i, ' HMR')
      .replace(/\s*LR/i, ' LR')
      .replace(/\s*SR/i, ' SR')
      .replace(/\s*PRC/i, ' PRC')
      .replace(/\s*CREEDMOOR/i, ' Creedmoor')
      .replace(/\s*BLACKOUT/i, ' Blackout')
      .replace(/\s*GRENDEL/i, ' Grendel')
      .replace(/\s*BOZ/i, ' Boz')
      .replace(/\s*RIMFIRE/i, ' Rimfire')
      .replace(/\s*SHOTGUN/i, ' Shotgun')
      .replace(/\s*GAUGE/i, ' Gauge')
      .replace(/\s*MM/i, 'mm')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function normalizeBulletType(rsrType) {
    if (!rsrType) return '';
    // Map RSR bullet types to normalized types
    const map = {
      'FMJ': 'FMJ',
      'FULL METAL JACKET': 'FMJ',
      'JHP': 'JHP',
      'JACKETED HOLLOW POINT': 'JHP',
      'HP': 'HP',
      'HOLLOW POINT': 'HP',
      'SP': 'SP',
      'SOFT POINT': 'SP',
      'TMJ': 'TMJ',
      'TOTAL METAL JACKET': 'TMJ',
      'LRN': 'LRN',
      'LEAD ROUND NOSE': 'LRN',
      'SJHP': 'SJHP',
      'SEMI-JACKETED HOLLOW POINT': 'SJHP',
      'FRANGIBLE': 'Frangible',
      'BALL': 'Ball',
      'V-MAX': 'V-MAX',
      'POLYMER TIP': 'Polymer Tip',
      'BTHP': 'BTHP',
      'BOAT TAIL HOLLOW POINT': 'BTHP',
      // Add more as needed
    };
    let t = rsrType.trim().toUpperCase();
    return map[t] || rsrType.trim();
  }

  function bucketGrainWeight(grain) {
    if (!grain || isNaN(grain)) return '';
    grain = Number(grain);
    if (grain <= 40) return '0-40';
    if (grain <= 80) return '41-80';
    if (grain <= 150) return '81-150';
    if (grain <= 250) return '151-250';
    return '250+';
  }

  function bucketPrice(price) {
    if (!price || isNaN(price)) return '';
    price = Number(price);
    if (price < 10) return '0-9.99';
    if (price < 20) return '10-19.99';
    if (price < 40) return '20-39.99';
    if (price < 80) return '40-79.99';
    return '80-9999';
  }

  function extractShotSize(item) {
    // For shotgun, extract shot size or ounce of shot
    if (!item.caliber || !/GAUGE|SHOTGUN/i.test(item.caliber)) return null;
    // Try to extract shot size from description or bullet type
    let desc = (item.description || '') + ' ' + (item.bulletType || '');
    let match = desc.match(/#(\d+)/);
    if (match) return '#' + match[1];
    match = desc.match(/(\d+\.?\d*)\s*oz/i);
    if (match) return match[1] + ' oz';
    return null;
  }

  function getSubcategory(item) {
    // Map item.category or caliber to subcategory
    if (item.category) {
      let cat = item.category.toLowerCase();
      if (cat.includes('handgun')) return 'Handgun';
      if (cat.includes('rifle')) return 'Rifle';
      if (cat.includes('rimfire')) return 'Rimfire';
      if (cat.includes('shotgun')) return 'Shotgun';
    }
    // Fallback: guess from caliber
    let cal = (item.caliber || '').toLowerCase();
    if (/ga|gauge|shotgun/.test(cal)) return 'Shotgun';
    if (/lr|magnum|rem|win|prc|creedmoor|grendel|hmr|wsm|wssm|wmr|sr|springfield|blackout|boz|swedish|russian/.test(cal)) return 'Rifle';
    if (/acp|auto|luger|special|short|long|super|government/.test(cal)) return 'Handgun';
    if (/rimfire/.test(cal)) return 'Rimfire';
    return 'Other';
  }

  // Load ammo-data.json
  const response = await fetch('../Data/ammo-data.json');
  const ammoData = await response.json();

  // Build filter sets
  const filters = {
    caliber: new Set(),
    brand: new Set(),
    bulletType: new Set(),
    caseMaterial: new Set(),
    grain: new Set(),
    shotSize: new Set(),
    price: new Set(),
    subcategory: new Set(),
  };

  // Preprocess and normalize data
  const normalizedAmmo = ammoData.map(item => {
    const brand = normalizeBrand(item.manufacturer || item.brand);
    const caliber = normalizeCaliber(item.caliber);
    const bulletType = normalizeBulletType(item.bulletType);
    const caseMaterial = (item.caseMaterial || '').replace(/\bBRASS\b/i, 'Brass').replace(/\bSTEEL\b/i, 'Steel').replace(/\bALUMINUM\b/i, 'Aluminum').replace(/\bNICKEL\b/i, 'Nickel').trim();
    const grain = bucketGrainWeight(item.grainWeight);
    const price = bucketPrice(item.price);
    const shotSize = extractShotSize(item);
    const subcategory = getSubcategory(item);
    // Add to filter sets
    if (caliber) filters.caliber.add(caliber);
    if (brand) filters.brand.add(brand);
    if (bulletType) filters.bulletType.add(bulletType);
    if (caseMaterial) filters.caseMaterial.add(caseMaterial);
    if (grain) filters.grain.add(grain);
    if (price) filters.price.add(price);
    if (shotSize) filters.shotSize.add(shotSize);
    if (subcategory) filters.subcategory.add(subcategory);
    return {
      ...item,
      brand,
      caliber,
      bulletType,
      caseMaterial,
      grain,
      price,
      shotSize,
      subcategory,
    };
  });

  // Helper to sort filter values
  function sortFilterValues(key, values) {
    if (key === 'grain') {
      return ['0-40','41-80','81-150','151-250','250+'].filter(v => values.includes(v));
    }
    if (key === 'price') {
      return ['0-9.99','10-19.99','20-39.99','40-79.99','80-9999'].filter(v => values.includes(v));
    }
    if (key === 'subcategory') {
      return ['Handgun','Rifle','Rimfire','Shotgun','Other'].filter(v => values.includes(v));
    }
    return Array.from(values).sort();
  }

  // Populate filter UIs
  function populateFilterList(id, values, labelFn, dataAttr) {
    const ul = document.querySelector(`#${id} .filter-list`);
    if (!ul) return;
    ul.innerHTML = '';
    values.forEach(val => {
      if (!val) return;
      const li = document.createElement('li');
      const label = document.createElement('label');
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.setAttribute(dataAttr, val);
      label.appendChild(input);
      label.append(' ' + labelFn(val));
      li.appendChild(label);
      ul.appendChild(li);
    });
  }

  // Caliber
  populateFilterList('filter-caliber', sortFilterValues('caliber', Array.from(filters.caliber)), v => v, 'data-caliber');
  // Brand
  populateFilterList('filter-brand', sortFilterValues('brand', Array.from(filters.brand)), v => v, 'data-brand');
  // Bullet Type
  populateFilterList('filter-type', sortFilterValues('bulletType', Array.from(filters.bulletType)), v => v, 'data-bullettype');
  // Case Material
  populateFilterList('filter-case', sortFilterValues('caseMaterial', Array.from(filters.caseMaterial)), v => v, 'data-casematerial');
  // Grain Weight
  populateFilterList('filter-grain', sortFilterValues('grain', Array.from(filters.grain)), v => {
    switch(v) {
      case '0-40': return '0–40 gr';
      case '41-80': return '41–80 gr';
      case '81-150': return '81–150 gr';
      case '151-250': return '151–250 gr';
      case '250+': return '250+ gr';
      default: return v;
    }
  }, 'data-grain');
  // Shot Size / Ounce of Shot (shotgun only)
  populateFilterList('filter-shot', sortFilterValues('shotSize', Array.from(filters.shotSize)), v => v, 'data-shotsize');
  // Price
  populateFilterList('filter-price', sortFilterValues('price', Array.from(filters.price)), v => {
    switch(v) {
      case '0-9.99': return 'Under $10';
      case '10-19.99': return '$10–$20';
      case '20-39.99': return '$20–$40';
      case '40-79.99': return '$40–$80';
      case '80-9999': return '$80+';
      default: return v;
    }
  }, 'data-price');
  // Subcategory
  populateFilterList('filter-subcat', sortFilterValues('subcategory', Array.from(filters.subcategory)), v => v, 'data-subcat');

  // Filtering logic
  function getActiveFilters() {
    const getChecked = (sel, attr) => Array.from(document.querySelectorAll(sel+':checked')).map(cb => cb.getAttribute(attr));
    return {
      caliber: getChecked('#filter-caliber input[type=checkbox]', 'data-caliber'),
      brand: getChecked('#filter-brand input[type=checkbox]', 'data-brand'),
      bulletType: getChecked('#filter-type input[type=checkbox]', 'data-bullettype'),
      caseMaterial: getChecked('#filter-case input[type=checkbox]', 'data-casematerial'),
      grain: getChecked('#filter-grain input[type=checkbox]', 'data-grain'),
      shotSize: getChecked('#filter-shot input[type=checkbox]', 'data-shotsize'),
      price: getChecked('#filter-price input[type=checkbox]', 'data-price'),
      subcategory: getChecked('#filter-subcat input[type=checkbox]', 'data-subcat'),
      inStock: document.querySelector('#filter-in-stock')?.checked,
    };
  }

  function itemMatchesFilters(item, filters) {
    if (filters.caliber.length && !filters.caliber.includes(item.caliber)) return false;
    if (filters.brand.length && !filters.brand.includes(item.brand)) return false;
    if (filters.bulletType.length && !filters.bulletType.includes(item.bulletType)) return false;
    if (filters.caseMaterial.length && !filters.caseMaterial.includes(item.caseMaterial)) return false;
    if (filters.grain.length && !filters.grain.includes(item.grain)) return false;
    if (filters.shotSize.length && !filters.shotSize.includes(item.shotSize)) return false;
    if (filters.price.length && !filters.price.includes(item.price)) return false;
    if (filters.subcategory.length && !filters.subcategory.includes(item.subcategory)) return false;
    if (filters.inStock && !(item.stock > 0)) return false;
    return true;
  }

  // Hook into existing ammo rendering
  function updateAmmoGrid() {
    const filters = getActiveFilters();
    // Expose filtered data for other scripts
    window.filteredAmmoData = normalizedAmmo.filter(item => itemMatchesFilters(item, filters));
    // Dispatch event for other scripts to re-render
    document.dispatchEvent(new CustomEvent('ammoFiltersChanged', { detail: { filteredAmmo: window.filteredAmmoData } }));
  }

  // Listen for filter changes
  document.querySelectorAll('.ammo-filter-group input[type=checkbox]').forEach(cb => {
    cb.addEventListener('change', updateAmmoGrid);
  });
  // Listen for subcat filter (added below)
  document.querySelectorAll('#filter-subcat input[type=checkbox]').forEach(cb => {
    cb.addEventListener('change', updateAmmoGrid);
  });
  // Listen for in-stock filter
  document.querySelector('#filter-in-stock')?.addEventListener('change', updateAmmoGrid);

  // Initial filter
  updateAmmoGrid();

  // Expose for debugging
  window.ammoFilters = {
    normalizedAmmo,
    filters,
    getActiveFilters,
    updateAmmoGrid
  };
})();
