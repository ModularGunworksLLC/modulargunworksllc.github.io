// Enhanced Product Image Gallery
// Adds zoom functionality and better image display to product cards

(function() {
  'use strict';

  document.addEventListener('DOMContentLoaded', function() {
    initializeProductImageGalleries();
  });

  function initializeProductImageGalleries() {
    const productCards = document.querySelectorAll('[data-product-id]');
    
    productCards.forEach(card => {
      const imageBox = card.querySelector('.image-box');
      if (!imageBox) return;

      const img = imageBox.querySelector('img');
      if (!img) return;

      // Create enhanced gallery container
      const galleryContainer = document.createElement('div');
      galleryContainer.className = 'product-image-gallery';
      galleryContainer.style.cssText = `
        position: relative;
        overflow: hidden;
        background: #f9f9f9;
        border-radius: 6px;
        cursor: zoom-in;
        transition: all 0.3s ease;
      `;

      // Replace image box with gallery
      imageBox.style.position = 'relative';
      imageBox.innerHTML = '';
      
      // Add main image
      const mainImg = document.createElement('img');
      mainImg.src = img.src;
      mainImg.alt = img.alt;
      mainImg.style.cssText = `
        width: 100%;
        height: auto;
        display: block;
        transition: transform 0.3s ease;
      `;

      // Add zoom overlay on hover
      const zoomOverlay = document.createElement('div');
      zoomOverlay.className = 'zoom-overlay';
      zoomOverlay.innerHTML = '🔍';
      zoomOverlay.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        width: 40px;
        height: 40px;
        background: rgba(0,0,0,0.7);
        color: white;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        opacity: 0;
        transition: opacity 0.3s ease;
        z-index: 10;
      `;

      // Add in-stock badge
      const stockStatus = card.dataset.inStock !== 'false';
      const stockBadge = document.createElement('div');
      stockBadge.style.cssText = `
        position: absolute;
        top: 10px;
        left: 10px;
        padding: 0.5rem 0.75rem;
        background: ${stockStatus ? '#2d5016' : '#c00'};
        color: white;
        border-radius: 4px;
        font-size: 0.85rem;
        font-weight: bold;
        z-index: 9;
      `;
      stockBadge.textContent = stockStatus ? '✓ In Stock' : 'Out of Stock';

      imageBox.appendChild(mainImg);
      imageBox.appendChild(zoomOverlay);
      imageBox.appendChild(stockBadge);

      // Hover effects
      imageBox.addEventListener('mouseenter', function() {
        mainImg.style.transform = 'scale(1.05)';
        zoomOverlay.style.opacity = '1';
      });

      imageBox.addEventListener('mouseleave', function() {
        mainImg.style.transform = 'scale(1)';
        zoomOverlay.style.opacity = '0';
      });

      // Click to open zoom modal
      imageBox.addEventListener('click', function(e) {
        e.preventDefault();
        openImageZoom(img.src, img.alt);
      });
    });
  }

  function openImageZoom(imageSrc, altText) {
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'image-zoom-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      cursor: zoom-out;
    `;

    // Create close button
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '✕';
    closeBtn.style.cssText = `
      position: absolute;
      top: 20px;
      right: 20px;
      background: white;
      border: none;
      border-radius: 4px;
      width: 40px;
      height: 40px;
      font-size: 1.5rem;
      cursor: pointer;
      z-index: 1001;
      transition: background 0.3s;
    `;
    closeBtn.addEventListener('mouseenter', () => closeBtn.style.background = '#e0e0e0');
    closeBtn.addEventListener('mouseleave', () => closeBtn.style.background = 'white');

    // Create zoomed image
    const zoomedImg = document.createElement('img');
    zoomedImg.src = imageSrc;
    zoomedImg.alt = altText;
    zoomedImg.style.cssText = `
      max-width: 90vw;
      max-height: 90vh;
      object-fit: contain;
      border-radius: 6px;
    `;

    // Create info text
    const infoText = document.createElement('div');
    infoText.style.cssText = `
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      color: white;
      font-size: 0.95rem;
      text-align: center;
    `;
    infoText.innerHTML = `<p>${altText}</p><p style="font-size: 0.85rem; color: #ccc; margin-top: 0.5rem;">Click to close • Use arrow keys to navigate</p>`;

    modal.appendChild(closeBtn);
    modal.appendChild(zoomedImg);
    modal.appendChild(infoText);
    document.body.appendChild(modal);

    // Close modal functions
    const closeModal = () => {
      modal.remove();
    };

    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    // Keyboard support
    document.addEventListener('keydown', function escapeHandler(e) {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', escapeHandler);
      }
    });
  }

  // Add price display enhancements
  function enhancePriceDisplay() {
    const priceElements = document.querySelectorAll('[data-price]');
    priceElements.forEach(element => {
      const price = parseFloat(element.dataset.price);
      if (price > 0 && !element.innerHTML.includes('$')) {
        element.innerHTML = `<span style="font-size: 1.3rem; font-weight: bold; color: var(--color-primary);">$${price.toFixed(2)}</span>`;
      }
    });
  }

  // Add "Add to Cart" button enhancements
  function enhanceAddToCartButtons() {
    const addToCartButtons = document.querySelectorAll('[data-add-to-cart]');
    addToCartButtons.forEach(button => {
      button.style.cssText = `
        background: var(--color-primary);
        color: white;
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 4px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.3s ease;
        width: 100%;
      `;

      button.addEventListener('mouseenter', function() {
        this.style.background = '#990000';
        this.style.transform = 'translateY(-2px)';
      });

      button.addEventListener('mouseleave', function() {
        this.style.background = 'var(--color-primary)';
        this.style.transform = 'translateY(0)';
      });

      // Add success feedback
      button.addEventListener('click', function(e) {
        if (!this.hasAttribute('data-added')) {
          const originalText = this.textContent;
          this.textContent = '✓ Added to Cart';
          this.setAttribute('data-added', 'true');
          this.style.background = '#2d5016';
          
          setTimeout(() => {
            this.textContent = originalText;
            this.removeAttribute('data-added');
            this.style.background = 'var(--color-primary)';
          }, 2000);
        }
      });
    });
  }

  // Initialize all enhancements when images load
  setTimeout(() => {
    enhancePriceDisplay();
    enhanceAddToCartButtons();
  }, 500);

})();
