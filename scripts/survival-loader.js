// Initialize the universal product loader for survival category
let productLoader;

document.addEventListener('DOMContentLoaded', function() {
  productLoader = new ProductLoader({
    category: 'survival',
    pageSize: 24
  });
});
