// Initialize the universal product loader for magazines category
let productLoader;

document.addEventListener('DOMContentLoaded', function() {
  productLoader = new ProductLoader({
    category: 'magazines',
    pageSize: 24
  });
});
