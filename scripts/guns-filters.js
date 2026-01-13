/**
 * Enhanced Gun Filters
 * Handles filtering by: Category, Brand, Caliber, Barrel Length, Capacity, Price
 */

document.addEventListener('DOMContentLoaded', function() {
  initDynamicFilters();
  initEnhancedFilterTracking();
});

/**
 * Initialize dynamic filter lists (Brand, Caliber)
 */
function initDynamicFilters() {
  // Wait for products to load
  const checkLoaded = setInterval(() => {
    if (window.productLoader && window.productLoader.allProducts && window.productLoader.allProducts.length > 0) {
      clearInterval(checkLoaded);
      populateBrandFilter();
      populateCaliberFilter();
      
      // Apply filter limiting after dynamic population
      if (window.applyFilterLimiting) {
        window.applyFilterLimiting();
      }
    }
  }, 100);
}

/**
 * Populate Brand filter from product data
 */
function populateBrandFilter() {
  const products = window.productLoader?.allProducts || [];
  const brands = new Set();

  products.forEach(product => {
    if (product.brand) {
      brands.add(product.brand.trim());
    }
  });

  const brandList = document.querySelector('#filter-brand .filter-list');
  if (!brandList) return;

  const sortedBrands = Array.from(brands).sort();
  sortedBrands.forEach(brand => {
    const li = document.createElement('li');
    li.innerHTML = `<label><input type="checkbox" data-brand="${brand}"> ${brand}</label>`;
    brandList.appendChild(li);
  });
}

/**
 * Populate Caliber filter from product data
 */
function populateCaliberFilter() {
  const products = window.productLoader?.allProducts || [];
  const calibers = new Set();

  products.forEach(product => {
    // Try to extract caliber from product name (common patterns)
    const name = product.name || '';
    const commonCalibers = [
      '9mm', '.9mm', '9 mm',
      '.45 ACP', '.45', '45 ACP',
      '.40 S&W', '.40', '40 S&W',
      '.380', '.380 ACP',
      '.22 LR', '.22',
      '.223', '223 Rem', '5.56',
      '.308', '308 Win',
      '10mm', '10 mm',
      '7.62x39', '7.62',
      '300 Blackout', '.300 AAC',
      '6.5 Creedmoor',
      '5.45x39',
      '.357 Magnum', '.357',
      '.38 Special', '.38',
      '.44 Magnum', '.44',
      '12 GA', '12 gauge',
      '20 GA', '20 gauge',
      '.410'
    ];

    commonCalibers.forEach(cal => {
      if (name.toUpperCase().includes(cal.toUpperCase())) {
        calibers.add(cal);
      }
    });
  });

  const caliberList = document.querySelector('#filter-caliber .filter-list');
  if (!caliberList) return;

  const sortedCalibers = Array.from(calibers).sort();
  sortedCalibers.forEach(caliber => {
    const li = document.createElement('li');
    li.innerHTML = `<label><input type="checkbox" data-caliber="${caliber}"> ${caliber}</label>`;
    caliberList.appendChild(li);
  });
}

/**
 * Enhanced filter tracking with callback to apply filters
 */
function initEnhancedFilterTracking() {
  const filterCheckboxes = document.querySelectorAll(
    '.filter-list input[type="checkbox"], #filter-in-stock'
  );

  if (!filterCheckboxes.length) return;

  filterCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', function() {
      applyGunFilters();
      updateFilterBadge();
    });
  });

  updateFilterBadge();
}

/**
 * Apply all gun filters
 */
function applyGunFilters() {
  const selectedFilters = {
    category: getSelectedValues('data-category'),
    brand: getSelectedValues('data-brand'),
    caliber: getSelectedValues('data-caliber'),
    barrelLength: getSelectedValues('data-barrel-length'),
    capacity: getSelectedValues('data-capacity'),
    price: getSelectedValues('data-price'),
    inStock: document.getElementById('filter-in-stock')?.checked || false
  };

  // Filter products
  const filtered = window.productLoader?.allProducts.filter(product => {
    // Category filter (from product name analysis)
    if (selectedFilters.category.length > 0) {
      const nameUpper = (product.name || '').toUpperCase();
      const matchesCategory = selectedFilters.category.some(cat => {
        const catUpper = cat.toUpperCase();
        return nameUpper.includes(catUpper) ||
               nameUpper.includes(catUpper.replace(' COMPLIANT', ''));
      });
      if (!matchesCategory) return false;
    }

    // Brand filter
    if (selectedFilters.brand.length > 0) {
      if (!selectedFilters.brand.includes(product.brand?.trim())) return false;
    }

    // Caliber filter (from name)
    if (selectedFilters.caliber.length > 0) {
      const nameUpper = (product.name || '').toUpperCase();
      const matchesCaliber = selectedFilters.caliber.some(cal => 
        nameUpper.includes(cal.toUpperCase())
      );
      if (!matchesCaliber) return false;
    }

    // Barrel length filter (parse from name if available)
    if (selectedFilters.barrelLength.length > 0) {
      const nameUpper = (product.name || '').toUpperCase();
      const matchesBarrel = selectedFilters.barrelLength.some(range => {
        const [min, max] = range.split('-').map(Number);
        // Look for barrel length in name (e.g., "3.41"" or "16"")
        const match = nameUpper.match(/(\d+\.?\d*)["\"]?\s*(?:BARREL|BBL|INCH)/);
        if (match) {
          const length = parseFloat(match[1]);
          return length >= min && length <= max;
        }
        return false;
      });
      if (!matchesBarrel) return false;
    }

    // Capacity filter
    if (selectedFilters.capacity.length > 0) {
      const nameUpper = (product.name || '').toUpperCase();
      const matchesCapacity = selectedFilters.capacity.some(range => {
        const [min, max] = range.split('-').map(Number);
        // Look for capacity numbers in name
        const match = nameUpper.match(/(\d+)[\s-]?(?:RD|ROUND|CAPACITY|MAG)/);
        if (match) {
          const cap = parseInt(match[1]);
          return cap >= min && cap <= max;
        }
        return false;
      });
      if (!matchesCapacity) return false;
    }

    // Price filter
    if (selectedFilters.price.length > 0) {
      const price = product.price || 0;
      const matchesPrice = selectedFilters.price.some(range => {
        const [min, max] = range.split('-').map(Number);
        return price >= min && price <= max;
      });
      if (!matchesPrice) return false;
    }

    // Stock filter
    if (selectedFilters.inStock && !product.inStock) return false;

    return true;
  }) || [];

  // Update product loader with filtered results
  if (window.productLoader) {
    window.productLoader.filteredProducts = filtered;
    window.productLoader.currentPage = 1;
    window.productLoader.render();
  }
}

/**
 * Get all selected checkbox values for a data attribute
 */
function getSelectedValues(dataAttr) {
  const checkboxes = document.querySelectorAll(`.filter-list input[${dataAttr}]:checked`);
  return Array.from(checkboxes).map(cb => cb.getAttribute(dataAttr));
}

/**
 * Update filter badge count
 */
function updateFilterBadge() {
  const badgeElement = document.getElementById('active-filter-count');
  const clearBtn = document.getElementById('clear-filters');
  
  if (!badgeElement) return;

  const allCheckboxes = document.querySelectorAll(
    '.filter-list input[type="checkbox"]:checked, #filter-in-stock:checked'
  );
  const activeCount = allCheckboxes.length;

  if (activeCount > 0) {
    badgeElement.textContent = activeCount;
    badgeElement.style.display = 'flex';
    if (clearBtn) clearBtn.disabled = false;
  } else {
    badgeElement.style.display = 'none';
    if (clearBtn) clearBtn.disabled = true;
  }
}
