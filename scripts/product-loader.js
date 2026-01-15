/**
 * Product Loader
 * Loads and displays products from Chattanooga API JSON files
 */

class ProductLoader {
  constructor() {
    this.products = [];
    this.category = null;
  }

  /**
   * Load products for a specific category
   */
  async loadProducts(category) {
    try {
      const response = await fetch(`/data/products/${category}.json`);
      if (!response.ok) {
        console.error(`Failed to load products: ${response.status}`);
        return [];
      }
      const data = await response.json();
      this.products = data.products || [];
      this.category = category;
      console.log(`✅ Loaded ${this.products.length} products for ${category}`);
      return this.products;
    } catch (error) {
      console.error(`Error loading products:`, error);
      return [];
    }
  }

  /**
   * Render products in a container
   */
  renderProducts(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container #${containerId} not found`);
      return;
    }

    const {
      limit = null,
      sortBy = 'name',
      inStockOnly = true,
      template = this.defaultTemplate
    } = options;

    let products = [...this.products];

    // Filter in-stock if requested
    if (inStockOnly) {
      products = products.filter(p => p.inStock);
    }

    // Sort products
    products.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return (a.customPrice || a.retailPrice) - (b.customPrice || b.retailPrice);
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });

    // Limit results if specified
    if (limit) {
      products = products.slice(0, limit);
    }

    // Render products
    container.innerHTML = products
      .map(product => template(product))
      .join('');

    // Add event listeners
    this.attachEventListeners(container);
  }

  /**
   * Default product card template - uses existing product-card CSS
   */
  defaultTemplate(product) {
    const price = product.customPrice || product.retailPrice;
    const inStock = product.inventory > 0;
    const stockBadge = inStock 
      ? `<span class="stock-badge in-stock">In Stock</span>`
      : `<span class="stock-badge out-of-stock">Out of Stock</span>`;
    
    return `
      <div class="product-card">
        <div class="product-image">
          <img src="/images/products/placeholder.jpg" alt="${product.name}">
          ${stockBadge}
        </div>
        <div class="product-info">
          <div class="product-brand">${product.requiresFfl ? 'Requires FFL' : 'In Stock'}</div>
          <div class="product-name">${product.name}</div>
          <div class="product-pricing">
            <div class="price-current">$${price.toFixed(2)}</div>
          </div>
          <div class="inventory-info">${product.inventory} units available</div>
          <button class="product-button" data-product-id="${product.id}">
            ${inStock ? 'Add to Cart' : 'Notify Me'}
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Grid template for displaying products in a grid
   */
  gridTemplate(product) {
    const price = product.customPrice || product.retailPrice;
    return `
      <div class="product-grid-item">
        <img src="/images/products/placeholder.jpg" alt="${product.name}" class="product-image">
        <h4>${product.name}</h4>
        <p class="product-price">$${price.toFixed(2)}</p>
        <p class="product-stock">${product.inventory} in stock</p>
      </div>
    `;
  }

  /**
   * Attach event listeners to product buttons
   */
  attachEventListeners(container) {
    const buttons = container.querySelectorAll('.product-btn');
    buttons.forEach(button => {
      button.addEventListener('click', (e) => {
        const productId = e.target.dataset.productId;
        const product = this.products.find(p => p.id === productId);
        if (product && product.inStock) {
          this.addToCart(product);
        } else {
          this.notifyMe(product);
        }
      });
    });
  }

  /**
   * Add product to cart (stub - implement with your cart system)
   */
  addToCart(product) {
    console.log('Adding to cart:', product.name);
    alert(`${product.name} added to cart!`);
  }

  /**
   * Notify when back in stock (stub - implement notification system)
   */
  notifyMe(product) {
    console.log('Notify me when back in stock:', product.name);
    alert(`You'll be notified when ${product.name} is back in stock!`);
  }

  /**
   * Get product by ID
   */
  getProduct(productId) {
    return this.products.find(p => p.id === productId);
  }

  /**
   * Search products
   */
  search(query) {
    const lowerQuery = query.toLowerCase();
    return this.products.filter(p => 
      p.name.toLowerCase().includes(lowerQuery) ||
      p.id.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get summary stats
   */
  getStats() {
    return {
      total: this.products.length,
      inStock: this.products.filter(p => p.inStock).length,
      outOfStock: this.products.filter(p => !p.inStock).length,
      requiresFfl: this.products.filter(p => p.requiresFfl).length,
      lastSynced: this.products[0]?.lastUpdated || 'Unknown'
    };
  }
}

// Export for use in HTML
window.ProductLoader = ProductLoader;
