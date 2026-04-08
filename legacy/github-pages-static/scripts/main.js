// Simple utilities for the site
document.addEventListener('DOMContentLoaded', function() {
  // Add to cart button listeners
  const addToCartButtons = document.querySelectorAll('.product-btn');
  addToCartButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      const productName = this.parentElement.querySelector('.product-name').textContent;
      alert('Added to cart: ' + productName);
    });
  });

  // CTA button listeners
  const ctaButtons = document.querySelectorAll('.cta-btn');
  ctaButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      if (this.href && this.href.includes('contact')) {
        // Allow navigation
      } else if (!this.href || this.href === '#') {
        e.preventDefault();
        alert('Coming soon!');
      }
    });
  });
});
