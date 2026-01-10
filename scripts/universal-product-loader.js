/**
 * Universal Product Loader
 * Works with all shop pages by dynamically loading category-specific data
 * Supports filtering, sorting, and pagination
 */

class ProductLoader {
  constructor(config) {
    this.config = {
      dataUrl: '../Data/optics-data.json',
      category: 'optics',
      pageSize: 24,
      ...config
    };
    
    this.allProducts = [];
    this.filteredProducts = [];
    this.currentPage = 1;
    
    this.init();
  }

  init() {
    // Build correct data URL from category
    const category = this.config.category || 'optics';
    const dataUrl = `../Data/${category}-products.json`;
    
    console.log(`Loading products from: ${dataUrl}`);
    
    fetch(dataUrl)
      .then(res => {
        if (!res.ok) throw new Error(`Failed to load ${dataUrl}`);
        return res.json();
      })
      .then(data => {
        // New JSON format has { category, lastUpdated, count, products }
        if (data.products && Array.isArray(data.products)) {
          this.allProducts = data.products;
          console.log(`Loaded ${this.allProducts.length} products from ${category}`);
        } else if (Array.isArray(data)) {
          this.allProducts = data;
        } else {
          console.warn('Unexpected data format:', data);
          this.allProducts = [];
        }
        
        this.renderFilters();
        this.updatePage();
      })
      .catch(err => {
        console.error('Error loading product data:', err);
        const grid = document.getElementById('unified-grid');
        if (grid) {
          grid.innerHTML = `<div class="no-products" style="grid-column: 1 / -1;"><h3>Error Loading Products</h3><p>${err.message}</p></div>`;
        }
      });
  }

  renderFilters() {
    // Brand filter
    const brands = [...new Set(this.allProducts.map(p => p.brand || p.manufacturer).filter(Boolean))].sort();
    const brandList = document.querySelector('#filter-brand .filter-list');
    if (brandList) {
      brandList.innerHTML = brands.map(b => `<li><label><input type="checkbox" data-brand="${b}"> ${b}</label></li>`).join('');
    }

    // Populate dynamic filter listeners
    this.attachFilterListeners();
  }

  attachFilterListeners() {
    const filterGroups = ['filter-type', 'filter-brand', 'filter-price', 'filter-stock', 'filter-caliber', 'filter-magnification', 'filter-keyword'];
    filterGroups.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('change', () => {
          this.currentPage = 1;
          this.updatePage();
        });
      }
    });

    const sortBy = document.getElementById('sort-by');
    if (sortBy) {
      sortBy.addEventListener('change', () => this.updatePage());
    }

    const prevBtn = document.querySelector('button[data-page="prev"]');
    const nextBtn = document.querySelector('button[data-page="next"]');
    if (prevBtn) prevBtn.addEventListener('click', () => {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.updatePage();
      }
    });
    if (nextBtn) nextBtn.addEventListener('click', () => {
      this.currentPage++;
      this.updatePage();
    });
  }

  getActiveFilters() {
    const brands = Array.from(document.querySelectorAll('input[data-brand]:checked')).map(cb => cb.getAttribute('data-brand'));
    const types = Array.from(document.querySelectorAll('input[data-type]:checked')).map(cb => cb.getAttribute('data-type'));
    const prices = Array.from(document.querySelectorAll('input[data-price]:checked')).map(cb => cb.getAttribute('data-price'));
    const calibers = Array.from(document.querySelectorAll('input[data-caliber]:checked')).map(cb => cb.getAttribute('data-caliber'));
    const mags = Array.from(document.querySelectorAll('input[data-magnification]:checked')).map(cb => cb.getAttribute('data-magnification'));
    const inStock = document.getElementById('filter-in-stock')?.checked;
    const keywords = Array.from(document.querySelectorAll('input[data-keyword]:checked')).map(cb => cb.getAttribute('data-keyword'));
    
    return { brands, types, prices, calibers, mags, inStock, keywords };
  }

  applyFilters() {
    const { brands, types, prices, calibers, mags, inStock, keywords } = this.getActiveFilters();
    
    this.filteredProducts = this.allProducts.filter(item => {
      // Brand filter
      if (brands.length && !brands.includes(item.brand || item.manufacturer)) return false;
      
      // Type filter (match in name)
      if (types.length && !types.some(t => (item.name || '').toLowerCase().includes(t.toLowerCase()))) return false;
      
      // Caliber filter (match in name/category)
      if (calibers.length && !calibers.some(c => (item.name || '').toLowerCase().includes(c.toLowerCase()))) return false;
      
      // Magnification filter (match in name)
      if (mags.length && !mags.some(m => (item.name || '').toLowerCase().includes(m.toLowerCase()))) return false;
      
      // Price filter
      if (prices.length) {
        const price = item.msrp || item.price || 0;
        let match = false;
        for (const range of prices) {
          const [min, max] = range.split('-').map(Number);
          if (price >= min && price <= max) {
            match = true;
            break;
          }
        }
        if (!match) return false;
      }
      
      // Keyword filter
      if (keywords.length && !keywords.some(k => (item.description || '').toLowerCase().includes(k))) return false;
      
      // Stock filter
      if (inStock && !item.inStock) return false;
      
      return true;
    });
  }

  updatePage() {
    this.applyFilters();
    
    const sortBy = document.getElementById('sort-by')?.value || 'featured';
    if (sortBy === 'price-asc') {
      this.filteredProducts.sort((a, b) => (a.msrp || a.price || 0) - (b.msrp || b.price || 0));
    } else if (sortBy === 'price-desc') {
      this.filteredProducts.sort((a, b) => (b.msrp || b.price || 0) - (a.msrp || a.price || 0));
    }

    const total = this.filteredProducts.length;
    const totalPages = Math.max(1, Math.ceil(total / this.config.pageSize));
    if (this.currentPage > totalPages) this.currentPage = totalPages;
    
    const start = (this.currentPage - 1) * this.config.pageSize;
    const pageItems = this.filteredProducts.slice(start, start + this.config.pageSize);

    this.updateUI(pageItems, total, totalPages);
  }

  updateUI(pageItems, total, totalPages) {
    const resultCount = document.querySelector('.result-count');
    const pageInfo = document.querySelector('.page-info');
    const prevBtn = document.querySelector('button[data-page="prev"]');
    const nextBtn = document.querySelector('button[data-page="next"]');
    const grid = document.getElementById('unified-grid');

    if (resultCount) resultCount.textContent = `Showing ${pageItems.length} of ${total} products`;
    if (pageInfo) pageInfo.textContent = `Page ${this.currentPage} of ${totalPages}`;
    if (prevBtn) prevBtn.disabled = this.currentPage === 1;
    if (nextBtn) nextBtn.disabled = this.currentPage === totalPages;

    if (grid) {
      if (pageItems.length === 0) {
        grid.innerHTML = '<div class="no-products" style="grid-column: 1 / -1;"><h3>No Products Found</h3><p>Try adjusting your filters.</p></div>';
      } else {
        grid.innerHTML = pageItems.map(p => this.renderCard(p)).join('');
      }
    }
  }

  renderCard(item) {
    const inStock = item.qty > 0;
    const hasSale = item.map && item.map < (item.msrp || item.price || 0);
    const price = item.msrp || item.price || 0;
    const displayPrice = hasSale ? item.map : price;
    const imagePath = item.image || `https://via.placeholder.com/300x240/333/fff?text=${encodeURIComponent(item.brand || 'Product')}`;
    
    return `
      <article class="ammo-card" ${!inStock ? 'data-out-of-stock' : ''}>
        ${!inStock ? '<div class="ammo-stock-badge">Out of Stock</div>' : ''}
        <img class="ammo-card-main-img" 
             src="${imagePath}" 
             alt="${item.name}" 
             loading="lazy"
             onerror="this.src='https://via.placeholder.com/300x240/ccc/999?text=No+Image'">
        <div class="ammo-card-body">
          <h3 class="ammo-card-title">${item.name}</h3>
          <div class="ammo-card-brand">${item.brand || item.manufacturer || 'Unknown Brand'}</div>
          <div class="ammo-card-meta">SKU: ${item.sku}${item.upc ? ' • UPC: ' + item.upc : ''}</div>
          <div class="ammo-card-price">
            ${hasSale 
              ? `<span class="ammo-price-main">$${item.map.toFixed(2)}</span> <span class="ammo-price-sub">$${price.toFixed(2)}</span>` 
              : `<span class="ammo-price-main">$${displayPrice.toFixed(2)}</span>`
            }
          </div>
          <button class="ammo-card-button" 
                  onclick="productLoader.addToCart('${item.sku}')"
                  ${!inStock ? 'disabled' : ''}>
            ${inStock ? 'ADD TO CART' : 'OUT OF STOCK'}
          </button>
        </div>
      </article>
    `;
  }

  addToCart(sku) {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const product = this.allProducts.find(p => p.sku === sku);
    
    if (product) {
      const existingItem = cart.find(c => c.sku === sku);
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        cart.push({ ...product, quantity: 1 });
      }
      localStorage.setItem('cart', JSON.stringify(cart));
      alert(`${product.name} added to cart!`);
    }
  }
}

// Make it globally available
let productLoader;
