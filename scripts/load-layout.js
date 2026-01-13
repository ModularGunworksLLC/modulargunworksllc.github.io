/**
 * Dynamic Layout Loader
 * Injects header and footer into any page automatically
 * Usage: Add <script src="scripts/load-layout.js"></script> to any page
 */

(function() {
  // Get the current page's directory depth to calculate relative paths
  function getBasePath() {
    const path = window.location.pathname;
    const depth = (path.match(/\//g) || []).length - 1;
    
    // Root pages (/, /index.html, /about.html, etc.) have depth 1
    // Shop pages (/shop/ammunition.html) have depth 2
    if (depth <= 1) return './';
    return '../';
  }

  const basePath = getBasePath();

  // Load header
  fetch(basePath + 'includes/header.html')
    .then(response => {
      if (!response.ok) throw new Error('Failed to load header');
      return response.text();
    })
    .then(html => {
      const headerContainer = document.createElement('div');
      headerContainer.innerHTML = html;
      document.body.insertBefore(headerContainer, document.body.firstChild);
      
      // Reinitialize header functionality
      initializeHeader();
    })
    .catch(error => console.error('Error loading header:', error));

  // Load footer
  fetch(basePath + 'includes/footer.html')
    .then(response => {
      if (!response.ok) throw new Error('Failed to load footer');
      return response.text();
    })
    .then(html => {
      const footerContainer = document.createElement('div');
      footerContainer.innerHTML = html;
      document.body.appendChild(footerContainer);
    })
    .catch(error => console.error('Error loading footer:', error));

  // Initialize header interactive elements
  function initializeHeader() {
    // Logo click handler
    const logoLink = document.querySelector('.header-logo');
    if (logoLink) {
      logoLink.addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = basePath === './' ? 'index.html' : '../../index.html';
      });
    }

    // Search functionality
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.querySelector('.search-bar button');
    
    if (searchInput && searchBtn) {
      searchBtn.addEventListener('click', performSearch);
      searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') performSearch();
      });
    }
  }

  // Search function
  window.performSearch = function() {
    const query = document.getElementById('search-input').value.trim();
    if (query) {
      // Replace with your actual search implementation
      console.log('Searching for:', query);
      // For now, redirect to a search results page (you can create this later)
      // window.location.href = basePath + 'search.html?q=' + encodeURIComponent(query);
    }
  };

  // Expose basePath globally for other scripts if needed
  window.layoutBasePath = basePath;
})();
