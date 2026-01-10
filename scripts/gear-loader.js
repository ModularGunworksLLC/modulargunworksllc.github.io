// Initialize the universal product loader for gear category
let productLoader;

document.addEventListener('DOMContentLoaded', function() {
  productLoader = new ProductLoader({
    category: 'gear',
    pageSize: 24
  });
});
