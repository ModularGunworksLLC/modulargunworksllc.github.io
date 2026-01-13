// Enhanced shop page filtering with UI improvements
// This script adds advanced filtering capabilities to shop pages

(function() {
  'use strict';

  // Initialize enhanced filters
  document.addEventListener('DOMContentLoaded', function() {
    enhanceFilterUI();
  });

  function enhanceFilterUI() {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    // Add in-stock filter group at the top
    const inStockHtml = `
      <div class="filter-group" id="filter-in-stock" style="background: #e8f5e9; padding: 1rem; border-radius: 6px; margin-bottom: 1.5rem; border-left: 4px solid #2d5016;">
        <label style="display: flex; align-items: center; cursor: pointer; margin: 0;">
          <input type="checkbox" id="in-stock-toggle" style="width: auto; margin-right: 0.75rem; cursor: pointer;">
          <span style="font-weight: bold; color: #2d5016;">In Stock Only</span>
        </label>
        <p style="font-size: 0.85rem; color: #666; margin: 0.5rem 0 0 1.75rem;">Show only available items</p>
      </div>
    `;

    // Add price range filter  
    const priceRangeHtml = `
      <div class="filter-group" id="filter-price-range" style="margin-bottom: 1.5rem;">
        <h3 style="margin-bottom: 1rem;">Price Range</h3>
        <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem; align-items: center;">
          <input type="number" id="price-min" placeholder="Min" min="0" style="width: 50%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; font-size: 0.9rem;">
          <span style="color: #999;">–</span>
          <input type="number" id="price-max" placeholder="Max" style="width: 50%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; font-size: 0.9rem;">
        </div>
        <input type="range" id="price-slider" min="0" max="500" value="500" style="width: 100%; cursor: pointer;">
        <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: #666; margin-top: 0.5rem;">
          <span>$0</span>
          <span id="slider-value">$500</span>
        </div>
      </div>
    `;

    // Insert enhanced filters at the beginning of sidebar (before first filter group)
    const firstFilterGroup = sidebar.querySelector('.ammo-filter-group') || sidebar.querySelector('.filter-group');
    if (firstFilterGroup) {
      firstFilterGroup.insertAdjacentHTML('beforebegin', inStockHtml);
      firstFilterGroup.insertAdjacentHTML('beforebegin', priceRangeHtml);
    }

    // Event listeners for filters
    const inStockCheckbox = document.getElementById('in-stock-toggle');
    const priceSlider = document.getElementById('price-slider');
    const priceMinInput = document.getElementById('price-min');
    const priceMaxInput = document.getElementById('price-max');

    if (inStockCheckbox) {
      inStockCheckbox.addEventListener('change', applyFilters);
    }

    if (priceSlider) {
      priceSlider.addEventListener('input', function() {
        const value = this.value;
        document.getElementById('slider-value').textContent = `$${value}`;
        if (priceMaxInput) priceMaxInput.value = value;
        applyFilters();
      });
    }

    if (priceMinInput) {
      priceMinInput.addEventListener('change', applyFilters);
    }

    if (priceMaxInput) {
      priceMaxInput.addEventListener('change', function() {
        if (priceSlider && parseInt(this.value) > 0) {
          priceSlider.value = this.value;
          document.getElementById('slider-value').textContent = `$${this.value}`;
        }
        applyFilters();
      });
    }

    // Listen to existing caliber/category checkboxes
    const checkboxes = sidebar.querySelectorAll('input[type="checkbox"]:not(#in-stock-toggle)');
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', applyFilters);
    });

    // Add clear filters button
    const clearHtml = `
      <button id="clear-filters" style="width: 100%; padding: 0.75rem; background: #ddd; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; color: #333; margin-top: 1rem;">Clear All Filters</button>
    `;
    if (sidebar) {
      sidebar.insertAdjacentHTML('beforeend', clearHtml);
      const clearBtn = document.getElementById('clear-filters');
      if (clearBtn) {
        clearBtn.addEventListener('click', function() {
          // Clear all checkboxes
          sidebar.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
          // Clear price inputs
          if (priceMinInput) priceMinInput.value = '';
          if (priceMaxInput) priceMaxInput.value = '';
          if (priceSlider) {
            priceSlider.value = 500;
            document.getElementById('slider-value').textContent = '$500';
          }
          applyFilters();
        });
      }
    }

    // Add filter count indicator
    const filterIndicatorHtml = `
      <div id="active-filters-indicator" style="padding: 0.75rem; background: var(--color-accent); color: white; border-radius: 4px; margin-bottom: 1.5rem; text-align: center; font-weight: bold; display: none;">
        <span id="active-filter-count">0</span> filter(s) applied
      </div>
    `;
    if (firstFilterGroup) {
      firstFilterGroup.insertAdjacentHTML('beforebegin', filterIndicatorHtml);
    }
  }

  function applyFilters() {
    // Get all active filters
    const inStockOnly = document.getElementById('in-stock-toggle')?.checked || false;
    const minPrice = parseInt(document.getElementById('price-min')?.value || 0);
    const maxPrice = parseInt(document.getElementById('price-max')?.value || 999999);
    const selectedCallibers = Array.from(document.querySelectorAll('.sidebar input[data-caliber]:checked')).map(cb => cb.dataset.caliber);

    // Filter products (you'll need to implement the actual filtering logic based on your product data structure)
    const products = document.querySelectorAll('[data-product-id]');
    let visibleCount = 0;
    let filterCount = (inStockOnly ? 1 : 0) + (minPrice > 0 ? 1 : 0) + (maxPrice < 999999 ? 1 : 0) + (selectedCallibers.length > 0 ? 1 : 0);

    products.forEach(product => {
      let shouldShow = true;

      // Check in stock filter
      if (inStockOnly && product.dataset.inStock === 'false') {
        shouldShow = false;
      }

      // Check price filter
      const productPrice = parseFloat(product.dataset.price || 0);
      if (productPrice < minPrice || productPrice > maxPrice) {
        shouldShow = false;
      }

      // Check caliber filter
      if (selectedCallibers.length > 0) {
        const productCaliber = product.dataset.caliber;
        if (!selectedCallibers.includes(productCaliber)) {
          shouldShow = false;
        }
      }

      product.style.display = shouldShow ? 'block' : 'none';
      if (shouldShow) visibleCount++;
    });

    // Update filter indicator
    const indicator = document.getElementById('active-filters-indicator');
    const countSpan = document.getElementById('active-filter-count');
    if (indicator && countSpan) {
      if (filterCount > 0) {
        countSpan.textContent = filterCount;
        indicator.style.display = 'block';
      } else {
        indicator.style.display = 'none';
      }
    }

    // Show "no products found" message if needed
    let noProductsMsg = document.getElementById('no-products-message');
    if (visibleCount === 0) {
      if (!noProductsMsg) {
        noProductsMsg = document.createElement('div');
        noProductsMsg.id = 'no-products-message';
        noProductsMsg.style.cssText = 'grid-column: 1/-1; text-align: center; padding: 2rem; color: #666;';
        noProductsMsg.innerHTML = '<p style="font-size: 1.2rem;">No products found matching your filters.</p><p>Try adjusting your search criteria.</p>';
        const productList = document.getElementById('product-list');
        if (productList) productList.appendChild(noProductsMsg);
      }
      noProductsMsg.style.display = 'block';
    } else if (noProductsMsg) {
      noProductsMsg.style.display = 'none';
    }
  }

  // Add mobile filter toggle
  function enhanceMobileFilters() {
    if (window.innerWidth < 768) {
      const sidebar = document.querySelector('.sidebar');
      if (!sidebar) return;

      // Add mobile filter toggle button
      const toggleBtn = document.createElement('button');
      toggleBtn.className = 'mobile-filter-toggle';
      toggleBtn.textContent = '☰ Filters';
      toggleBtn.style.cssText = `
        display: block;
        width: 100%;
        padding: 1rem;
        background: var(--color-primary);
        color: white;
        border: none;
        border-radius: 4px;
        font-weight: bold;
        font-size: 1.1rem;
        cursor: pointer;
        margin-bottom: 1.5rem;
      `;

      sidebar.insertAdjacentElement('beforebegin', toggleBtn);

      toggleBtn.addEventListener('click', function() {
        sidebar.classList.toggle('mobile-expanded');
        toggleBtn.textContent = sidebar.classList.contains('mobile-expanded') ? '✕ Close Filters' : '☰ Filters';
      });

      sidebar.style.cssText = `
        display: none;
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        z-index: 50;
      `;

      sidebar.addEventListener('click', (e) => {
        if (e.target.tagName === 'INPUT') {
          // Allow interaction with inputs
        }
      });
    }
  }

  enhanceMobileFilters();
})();
