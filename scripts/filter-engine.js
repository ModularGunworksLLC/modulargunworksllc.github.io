/**
 * Filter Engine for Product Pages
 * Dynamically extracts filter values from product data
 * and applies filtering to product display
 */

class FilterEngine {
  constructor(productData) {
    this.data = productData;
    this.products = productData.products || [];
    this.filterDefinitions = productData.filters?.definitions || {};
    this.appliedFilters = {};
    this.init();
  }

  /**
   * Initialize filter engine
   */
  init() {
    // Extract filter values from products
    this.extractFilterValues();
    
    // Render filter UI
    this.renderFilters();
    
    // Bind event listeners
    this.bindEvents();
  }

  /**
   * Extract unique values for each filter from products
   */
  extractFilterValues() {
    // Reset filter options
    for (const filterKey in this.filterDefinitions) {
      if (this.filterDefinitions[filterKey].type === 'checkbox') {
        this.filterDefinitions[filterKey].options = [];
      }
    }

    const filterValues = {
      ammoType: {},
      caliber: {},
      brand: {},
      bulletType: {},
      casingType: {},
      roundCount: {},
      priceMin: Infinity,
      priceMax: 0
    };

    // Parse each product
    this.products.forEach(product => {
      // Ammo Type (from category or product name)
      const ammoType = this.extractAmmoType(product.name);
      if (ammoType) {
        filterValues.ammoType[ammoType] = (filterValues.ammoType[ammoType] || 0) + 1;
      }

      // Caliber
      const caliber = this.extractCaliber(product.name);
      if (caliber) {
        filterValues.caliber[caliber] = (filterValues.caliber[caliber] || 0) + 1;
      }

      // Brand
      if (product.brand) {
        filterValues.brand[product.brand] = (filterValues.brand[product.brand] || 0) + 1;
      }

      // Bullet Type
      const bulletType = this.extractBulletType(product.name);
      if (bulletType) {
        filterValues.bulletType[bulletType] = (filterValues.bulletType[bulletType] || 0) + 1;
      }

      // Casing Type
      const casingType = this.extractCasingType(product.name);
      if (casingType) {
        filterValues.casingType[casingType] = (filterValues.casingType[casingType] || 0) + 1;
      }

      // Round Count
      const roundCount = this.extractRoundCount(product.name);
      if (roundCount) {
        filterValues.roundCount[roundCount] = (filterValues.roundCount[roundCount] || 0) + 1;
      }

      // Price
      filterValues.priceMin = Math.min(filterValues.priceMin, product.price);
      filterValues.priceMax = Math.max(filterValues.priceMax, product.price);
    });

    // Convert to sorted arrays for display
    const sortByCount = (obj) => {
      return Object.entries(obj)
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count);
    };

    // Update filter definitions with extracted values
    if (this.filterDefinitions.ammoType) {
      this.filterDefinitions.ammoType.options = sortByCount(filterValues.ammoType);
    }
    if (this.filterDefinitions.caliber) {
      this.filterDefinitions.caliber.options = sortByCount(filterValues.caliber);
    }
    if (this.filterDefinitions.brand) {
      this.filterDefinitions.brand.options = sortByCount(filterValues.brand);
    }
    if (this.filterDefinitions.bulletType) {
      this.filterDefinitions.bulletType.options = sortByCount(filterValues.bulletType);
    }
    if (this.filterDefinitions.casingType) {
      this.filterDefinitions.casingType.options = sortByCount(filterValues.casingType);
    }
    if (this.filterDefinitions.roundCount) {
      this.filterDefinitions.roundCount.options = sortByCount(filterValues.roundCount);
    }
    if (this.filterDefinitions.price) {
      this.filterDefinitions.price.min = Math.floor(filterValues.priceMin);
      this.filterDefinitions.price.max = Math.ceil(filterValues.priceMax);
    }
  }

  /**
   * Extract ammunition type from product name
   */
  extractAmmoType(name) {
    const name_lower = name.toLowerCase();
    if (name_lower.includes('shotgun') || name_lower.includes('gauge')) return 'Shotgun Ammo';
    if (name_lower.includes('rifle')) return 'Rifle Ammo';
    if (name_lower.includes('handgun') || name_lower.includes('pistol')) return 'Handgun Ammo';
    if (name_lower.includes('hunting')) return 'Hunting Ammo';
    if (name_lower.match(/\.22|22lr|rimfire/i)) return 'Rimfire Ammo';
    return null;
  }

  /**
   * Extract caliber from product name
   */
  extractCaliber(name) {
    const calibers = [
      '12 Gauge', '20 Gauge', '410 Gauge',
      '9mm', '.40 S&W', '.45 ACP', '.38 Special', '.357 Magnum',
      '.223 Remington', '.308 Winchester', '7.62x39', '.300 Blackout',
      '.270 Winchester', '30-06', '300 Win Mag', '338 Lapua',
      '22 LR', '17 HMR',
      '45-70', '30-30'
    ];

    for (const caliber of calibers) {
      if (name.toLowerCase().includes(caliber.toLowerCase())) {
        return caliber;
      }
    }
    return null;
  }

  /**
   * Extract bullet type from product name
   */
  extractBulletType(name) {
    const bulletTypes = {
      'FMJ': 'Full Metal Jacket',
      'JHP': 'Hollow Point',
      'HP': 'Hollow Point',
      'Training': 'Training',
      'Hunting': 'Hunting',
      'Plated': 'Plated',
      'Soft Point': 'Soft Point',
      'SP': 'Soft Point'
    };

    for (const [abbr, full] of Object.entries(bulletTypes)) {
      if (name.includes(abbr)) {
        return full;
      }
    }
    return null;
  }

  /**
   * Extract casing type from product name
   */
  extractCasingType(name) {
    const name_lower = name.toLowerCase();
    if (name_lower.includes('brass')) return 'Brass';
    if (name_lower.includes('steel')) return 'Steel';
    if (name_lower.includes('aluminum')) return 'Aluminum';
    if (name_lower.includes('plastic')) return 'Plastic';
    return null;
  }

  /**
   * Extract round count from product name
   */
  extractRoundCount(name) {
    const match = name.match(/(\d+)\s*(round|rd|ct|count)/i);
    if (match) {
      return match[1] + ' rounds';
    }
    return null;
  }

  /**
   * Render filter UI
   */
  renderFilters() {
    const container = document.getElementById('filters-container');
    if (!container) return;

    let filterHTML = '<div class="filters-title">Filters</div>';

    const enabledFilters = this.data.filters?.enabled || [];

    enabledFilters.forEach(filterKey => {
      const filterDef = this.filterDefinitions[filterKey];
      if (!filterDef) return;

      filterHTML += this.renderFilterGroup(filterKey, filterDef);
    });

    filterHTML += '<button class="clear-filters" id="clear-filters-btn">Clear All Filters</button>';
    container.innerHTML = filterHTML;
  }

  /**
   * Render individual filter group
   */
  renderFilterGroup(filterKey, filterDef) {
    let html = `<div class="filter-group" data-filter="${filterKey}">`;
    
    // Header
    html += `<div class="filter-header">
      <span>${filterDef.label}</span>
      <span class="toggle-icon">▼</span>
    </div>`;

    // Options Container
    html += '<div class="filter-options">';

    if (filterDef.type === 'checkbox') {
      // Search input
      if (filterDef.searchable) {
        html += `<input type="text" class="filter-search" placeholder="Search..." data-filter="${filterKey}">`;
      }

      // Options
      html += '<div class="filter-options-list">';
      filterDef.options.forEach((option, index) => {
        const isHidden = index >= filterDef.showCount ? 'hidden' : '';
        html += `
          <div class="filter-option ${isHidden}" data-value="${option.label}">
            <input type="checkbox" id="${filterKey}-${option.label}" data-filter="${filterKey}" value="${option.label}">
            <label for="${filterKey}-${option.label}">
              <span class="option-label">${option.label}</span>
              <span class="option-count">${option.count}</span>
            </label>
          </div>
        `;
      });
      html += '</div>';

      // Show More button
      if (filterDef.options.length > filterDef.showCount) {
        html += `<div class="filter-show-more">
          <button class="show-more-btn" data-filter="${filterKey}">Show more</button>
        </div>`;
      }
    } else if (filterDef.type === 'range') {
      // Price range
      html += `<div class="filter-price-range">
        <input type="number" id="${filterKey}-min" placeholder="Min" value="${filterDef.min}" data-filter="${filterKey}" data-type="min">
        <span>-</span>
        <input type="number" id="${filterKey}-max" placeholder="Max" value="${filterDef.max}" data-filter="${filterKey}" data-type="max">
      </div>`;
    }

    html += '</div>';
    html += '</div>';

    return html;
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Toggle filter groups
    document.querySelectorAll('.filter-header').forEach(header => {
      header.addEventListener('click', (e) => {
        const group = header.closest('.filter-group');
        const options = group.querySelector('.filter-options');
        
        header.classList.toggle('collapsed');
        options.classList.toggle('open');
      });
    });

    // Show more/less filters
    document.querySelectorAll('.show-more-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const filterKey = btn.dataset.filter;
        const container = btn.closest('.filter-group');
        const hiddenOptions = container.querySelectorAll('.filter-option.hidden');

        hiddenOptions.forEach(opt => opt.classList.remove('hidden'));
        btn.textContent = 'Show less';
        btn.classList.add('show-less');
      });
    });

    // Filter search
    document.querySelectorAll('.filter-search').forEach(input => {
      input.addEventListener('keyup', (e) => {
        const filterKey = input.dataset.filter;
        const searchTerm = input.value.toLowerCase();
        const container = input.closest('.filter-group');
        const options = container.querySelectorAll('.filter-option');

        options.forEach(option => {
          const label = option.textContent.toLowerCase();
          if (label.includes(searchTerm)) {
            option.style.display = '';
          } else {
            option.style.display = 'none';
          }
        });
      });
    });

    // Checkbox filters
    document.querySelectorAll('.filter-option input[type="checkbox"]').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        this.applyFilters();
      });
    });

    // Price range filters
    document.querySelectorAll('.filter-price-range input').forEach(input => {
      input.addEventListener('change', () => {
        this.applyFilters();
      });
    });

    // Clear filters button
    document.getElementById('clear-filters-btn')?.addEventListener('click', () => {
      this.clearFilters();
    });
  }

  /**
   * Apply filters to products
   */
  applyFilters() {
    this.appliedFilters = {};

    // Get checked filters
    document.querySelectorAll('.filter-option input[type="checkbox"]:checked').forEach(checkbox => {
      const filterKey = checkbox.dataset.filter;
      if (!this.appliedFilters[filterKey]) {
        this.appliedFilters[filterKey] = [];
      }
      this.appliedFilters[filterKey].push(checkbox.value);
    });

    // Get price range
    const priceMin = parseInt(document.getElementById('price-min')?.value || 0);
    const priceMax = parseInt(document.getElementById('price-max')?.value || 999999);

    // Filter products
    let filteredProducts = this.products.filter(product => {
      // Check checkbox filters
      for (const [filterKey, values] of Object.entries(this.appliedFilters)) {
        if (values.length === 0) continue;

        let productValue = null;

        if (filterKey === 'caliber') {
          productValue = this.extractCaliber(product.name);
        } else if (filterKey === 'brand') {
          productValue = product.brand;
        } else if (filterKey === 'bulletType') {
          productValue = this.extractBulletType(product.name);
        } else if (filterKey === 'casingType') {
          productValue = this.extractCasingType(product.name);
        } else if (filterKey === 'roundCount') {
          productValue = this.extractRoundCount(product.name);
        } else if (filterKey === 'ammoType') {
          productValue = this.extractAmmoType(product.name);
        } else if (filterKey === 'stock') {
          productValue = product.inventory > 0 ? 'in-stock' : 'out-of-stock';
        }

        if (!values.includes(productValue)) {
          return false;
        }
      }

      // Check price range
      if (product.price < priceMin || product.price > priceMax) {
        return false;
      }

      return true;
    });

    // Update display
    this.displayProducts(filteredProducts);
    this.updateFilterCounts(filteredProducts);
    this.updateClearButton();
  }

  /**
   * Display filtered products
   */
  displayProducts(products) {
    // This will be called by the product renderer
    window.dispatchEvent(new CustomEvent('filterApplied', { detail: { products } }));
  }

  /**
   * Update filter option counts
   */
  updateFilterCounts(products) {
    // Update counts based on filtered products
    document.querySelectorAll('.filter-option').forEach(option => {
      const filterKey = option.querySelector('input').dataset.filter;
      const optionValue = option.querySelector('input').value;
      let matchCount = 0;

      products.forEach(product => {
        let productValue = null;

        if (filterKey === 'caliber') {
          productValue = this.extractCaliber(product.name);
        } else if (filterKey === 'brand') {
          productValue = product.brand;
        } else if (filterKey === 'bulletType') {
          productValue = this.extractBulletType(product.name);
        } else if (filterKey === 'casingType') {
          productValue = this.extractCasingType(product.name);
        } else if (filterKey === 'roundCount') {
          productValue = this.extractRoundCount(product.name);
        } else if (filterKey === 'ammoType') {
          productValue = this.extractAmmoType(product.name);
        }

        if (productValue === optionValue) {
          matchCount++;
        }
      });

      const countEl = option.querySelector('.option-count');
      if (countEl) {
        countEl.textContent = matchCount;
      }
      option.style.opacity = matchCount === 0 ? '0.5' : '1';
    });
  }

  /**
   * Clear all filters
   */
  clearFilters() {
    document.querySelectorAll('.filter-option input[type="checkbox"]').forEach(checkbox => {
      checkbox.checked = false;
    });
    document.getElementById('price-min').value = this.filterDefinitions.price?.min || 0;
    document.getElementById('price-max').value = this.filterDefinitions.price?.max || 999999;
    
    this.appliedFilters = {};
    this.displayProducts(this.products);
    this.updateFilterCounts(this.products);
    this.updateClearButton();
  }

  /**
   * Update clear button visibility
   */
  updateClearButton() {
    const hasActiveFilters = Object.values(this.appliedFilters).some(arr => arr.length > 0);
    const btn = document.getElementById('clear-filters-btn');
    if (btn) {
      btn.classList.toggle('active', hasActiveFilters);
    }
  }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
  if (window.PRODUCT_DATA && window.PRODUCT_DATA.filters) {
    window.filterEngine = new FilterEngine(window.PRODUCT_DATA);
  }
});

// Listen for filter changes
document.addEventListener('filterApplied', (e) => {
  if (typeof renderProducts === 'function') {
    renderProducts(e.detail.products);
  }
});
