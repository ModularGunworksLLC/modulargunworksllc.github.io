// Initialize the universal product loader for ammunition category
let productLoader;

document.addEventListener('DOMContentLoaded', function() {
  productLoader = new ProductLoader({
    category: 'ammunition',
    pageSize: 24
  });
});
