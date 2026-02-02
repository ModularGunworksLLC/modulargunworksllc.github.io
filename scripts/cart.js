// scripts/cart.js
// Industry-standard shopping cart using localStorage
// Provides: addToCart, removeFromCart, updateCartQuantity, getCart, getCartCount, clearCart

(function () {
  const CART_KEY = 'mgw_cart';

  // Get cart from localStorage
  function getCart() {
    try {
      const data = localStorage.getItem(CART_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading cart:', e);
      return [];
    }
  }

  // Save cart to localStorage
  function saveCart(cart) {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
      updateCartBadges();
      return true;
    } catch (e) {
      console.error('Error saving cart:', e);
      return false;
    }
  }

  // Add item to cart
  function addToCart(sku, name, price, quantity, image, category) {
    if (!sku || !name) {
      console.error('addToCart requires sku and name');
      return false;
    }

    quantity = parseInt(quantity) || 1;
    price = parseFloat(price) || 0;

    const cart = getCart();
    const existingIndex = cart.findIndex(item => item.sku === sku);

    if (existingIndex >= 0) {
      // Update quantity if already in cart
      cart[existingIndex].quantity += quantity;
    } else {
      // Add new item
      cart.push({
        sku: sku,
        name: name,
        price: price,
        quantity: quantity,
        image: image || '',
        category: category || '',
        addedAt: Date.now()
      });
    }

    saveCart(cart);
    showCartNotification(name, quantity);
    return true;
  }

  // Remove item from cart
  function removeFromCart(sku) {
    const cart = getCart();
    const newCart = cart.filter(item => item.sku !== sku);
    saveCart(newCart);
    return true;
  }

  // Update quantity of item in cart
  function updateCartQuantity(sku, quantity) {
    quantity = parseInt(quantity) || 0;
    if (quantity <= 0) {
      return removeFromCart(sku);
    }

    const cart = getCart();
    const item = cart.find(item => item.sku === sku);
    if (item) {
      item.quantity = quantity;
      saveCart(cart);
    }
    return true;
  }

  // Get total count of items in cart
  function getCartCount() {
    const cart = getCart();
    return cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
  }

  // Get cart total price
  function getCartTotal() {
    const cart = getCart();
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  // Clear entire cart
  function clearCart() {
    saveCart([]);
    return true;
  }

  // Update cart count badges in header
  function updateCartBadges() {
    const count = getCartCount();
    const badges = document.querySelectorAll('.cart-count-badge');
    badges.forEach(badge => {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'inline-flex' : 'none';
    });

    // Also update any cart links text
    const cartLinks = document.querySelectorAll('.cart-link-text');
    cartLinks.forEach(link => {
      link.textContent = count > 0 ? `Cart (${count})` : 'Cart';
    });
  }

  // Show notification when item added
  function showCartNotification(name, quantity) {
    // Remove existing notification
    const existing = document.getElementById('cart-notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.id = 'cart-notification';
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <i class="fas fa-check-circle" style="color: #4caf50; font-size: 1.5rem;"></i>
        <div>
          <div style="font-weight: 600; margin-bottom: 2px;">Added to Cart</div>
          <div style="font-size: 0.9rem; color: #666;">${quantity}× ${escapeHtml(name.substring(0, 50))}${name.length > 50 ? '...' : ''}</div>
        </div>
      </div>
      <div style="display: flex; gap: 10px; margin-top: 12px;">
        <a href="${getCartUrl()}" style="flex: 1; padding: 8px 16px; background: #b22222; color: #fff; text-decoration: none; border-radius: 4px; text-align: center; font-weight: 600; font-size: 0.9rem;">View Cart</a>
        <button onclick="this.closest('#cart-notification').remove()" style="padding: 8px 16px; background: #f5f5f5; border: 1px solid #999; border-radius: 4px; cursor: pointer; font-weight: 600; font-size: 0.9rem; color: #333;">Continue Shopping</button>
      </div>
    `;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #fff;
      padding: 16px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      z-index: 10000;
      max-width: 360px;
      animation: slideIn 0.3s ease;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    // Add animation styles if not present
    if (!document.getElementById('cart-notification-styles')) {
      const style = document.createElement('style');
      style.id = 'cart-notification-styles';
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
      }
    }, 5000);
  }

  // Helper to get cart URL relative to current page
  function getCartUrl() {
    const path = window.location.pathname;
    if (path.includes('/shop/')) {
      return 'cart.html';
    }
    return 'shop/cart.html';
  }

  // Escape HTML for safe display
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  // Expose functions globally
  window.MGWCart = {
    add: addToCart,
    remove: removeFromCart,
    updateQuantity: updateCartQuantity,
    get: getCart,
    getCount: getCartCount,
    getTotal: getCartTotal,
    clear: clearCart,
    updateBadges: updateCartBadges
  };

  // Legacy support - replace old addToCart alerts
  window.addToCart = function (sku, name, price, quantity, image, category) {
    return addToCart(sku, name, price, quantity || 1, image, category);
  };

  // Update badges on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateCartBadges);
  } else {
    updateCartBadges();
  }
})();
