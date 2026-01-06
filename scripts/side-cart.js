// Side Cart Drawer Logic
function getCart() {
  return JSON.parse(localStorage.getItem('cart') || '[]');
}

function setCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
}

function updateCartBadge() {
  const cart = getCart();
  const badge = document.getElementById('cart-badge');
  if (badge) {
    if (cart.length > 0) {
      let count = cart.reduce((sum, item) => sum + (item.qty || 1), 0);
      badge.textContent = count;
      badge.style.display = 'inline-block';
    } else {
      badge.style.display = 'none';
    }
  }
}

function renderSideCart() {
  const cart = getCart();
  const itemsDiv = document.getElementById('side-cart-items');
  const footerDiv = document.getElementById('side-cart-footer');
  if (!itemsDiv || !footerDiv) return;
  if (cart.length === 0) {
    itemsDiv.innerHTML = '<p style="color:#888;text-align:center;margin-top:40px;">Your cart is empty.</p>';
    footerDiv.innerHTML = '';
    return;
  }
  let subtotal = 0;
  itemsDiv.innerHTML = cart.map(item => {
    const qty = item.qty || 1;
    subtotal += item.price * qty;
    return `<div style='display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;'>
      <div>
        <div style='font-weight:600;'>${item.name}</div>
        <div style='color:#888;font-size:0.95rem;'>SKU: ${item.sku}</div>
        <div style='font-size:1.05rem;'>$${item.price.toFixed(2)} x ${qty}</div>
      </div>
      <div style='display:flex;align-items:center;gap:6px;'>
        <button onclick="window.sideCartQty('${item.sku}',-1)" style='background:#eee;color:#333;border:none;padding:3px 9px;border-radius:4px;font-size:1.1rem;cursor:pointer;'>-</button>
        <span style='min-width:22px;display:inline-block;text-align:center;'>${qty}</span>
        <button onclick="window.sideCartQty('${item.sku}',1)" style='background:#eee;color:#333;border:none;padding:3px 9px;border-radius:4px;font-size:1.1rem;cursor:pointer;'>+</button>
        <button onclick="window.sideCartRemove('${item.sku}')" style='background:#e74c3c;color:#fff;border:none;padding:3px 9px;border-radius:4px;font-size:1rem;cursor:pointer;margin-left:6px;'>🗑</button>
      </div>
    </div>`;
  }).join('');
  footerDiv.innerHTML = `<div style='font-size:1.1rem;font-weight:600;margin-bottom:10px;'>Subtotal: $${subtotal.toFixed(2)}</div>
    <a href='checkout.html' style='display:block;background:#0033aa;color:#fff;text-align:center;padding:12px 0;border-radius:6px;font-size:1.1rem;text-decoration:none;font-weight:600;'>Checkout</a>`;
}

function openSideCart() {
  document.getElementById('side-cart').style.right = '0';
  document.getElementById('side-cart-backdrop').style.display = 'block';
  renderSideCart();
}

function closeSideCart() {
  document.getElementById('side-cart').style.right = '-400px';
  document.getElementById('side-cart-backdrop').style.display = 'none';
}

window.sideCartQty = function(sku, delta) {
  let cart = getCart();
  cart = cart.map(item => {
    if (item.sku === sku) {
      let newQty = (item.qty || 1) + delta;
      if (newQty < 1) newQty = 1;
      return { ...item, qty: newQty };
    }
    return item;
  });
  setCart(cart);
  renderSideCart();
  updateCartBadge();
};

window.sideCartRemove = function(sku) {
  let cart = getCart();
  cart = cart.filter(item => item.sku !== sku);
  setCart(cart);
  renderSideCart();
  updateCartBadge();
};

document.addEventListener('DOMContentLoaded', function() {
  updateCartBadge();
  const cartIcon = document.getElementById('cart-header-icon');
  if (cartIcon) {
    cartIcon.addEventListener('click', openSideCart);
  }
  const closeBtn = document.getElementById('close-side-cart');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeSideCart);
  }
  const backdrop = document.getElementById('side-cart-backdrop');
  if (backdrop) {
    backdrop.addEventListener('click', closeSideCart);
  }
  // Update badge and side cart on storage change (multi-tab)
  window.addEventListener('storage', function(e) {
    if (e.key === 'cart') {
      updateCartBadge();
      renderSideCart();
    }
  });
});

// For other scripts to call after cart changes
window.updateCartBadge = updateCartBadge;
