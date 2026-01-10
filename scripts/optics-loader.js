// Initialize the universal product loader for optics category
let productLoader;

document.addEventListener('DOMContentLoaded', function() {
  productLoader = new ProductLoader({
    category: 'optics',
    pageSize: 24
  });
});

