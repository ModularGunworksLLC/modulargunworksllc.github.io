// Initialize the universal product loader for guns category
let productLoader;

document.addEventListener('DOMContentLoaded', function() {
  productLoader = new ProductLoader({
    category: 'guns',
    pageSize: 24
  });
});
