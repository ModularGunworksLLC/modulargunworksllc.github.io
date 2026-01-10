// Initialize the universal product loader for reloading category
let productLoader;

document.addEventListener('DOMContentLoaded', function() {
  productLoader = new ProductLoader({
    category: 'reloading',
    pageSize: 24
  });
});
