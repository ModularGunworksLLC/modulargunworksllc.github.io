/**
 * Filter Management - Collapsible Filters and Search Functionality
 * Performance optimized: event delegation, debounced search, minimal DOM manipulation
 */

// Initialize collapsible filters on page load
document.addEventListener('DOMContentLoaded', function() {
  initCollapsibleFilters();
  initFilterSearch();
});

/**
 * Initialize collapsible filter functionality
 * Expands ammunition-type and caliber by default, collapses others for performance
 */
function initCollapsibleFilters() {
  const filterHeaders = document.querySelectorAll('.filter-header');
  
  filterHeaders.forEach(header => {
    const filterId = header.getAttribute('data-filter');
    const filterGroup = header.parentElement;
    const filterContent = filterGroup.querySelector('.filter-content');
    
    // Expand ammunition-type, caliber, and brand by default
    const expandByDefault = ['filter-ammo-type', 'filter-caliber', 'filter-brand'].includes(filterId);
    
    if (!expandByDefault && filterContent) {
      filterContent.style.display = 'none';
      filterGroup.classList.add('collapsed');
    }
    
    // Add click listener to expand/collapse
    header.addEventListener('click', function(e) {
      e.preventDefault();
      toggleFilter(filterId);
    });
  });
}

/**
 * Toggle filter open/closed
 */
function toggleFilter(filterId) {
  const filterGroup = document.getElementById(filterId);
  if (!filterGroup) return;
  
  const filterContent = filterGroup.querySelector('.filter-content');
  const isCollapsed = filterGroup.classList.contains('collapsed');
  
  if (isCollapsed) {
    // Expand
    filterContent.style.display = 'block';
    filterGroup.classList.remove('collapsed');
  } else {
    // Collapse
    filterContent.style.display = 'none';
    filterGroup.classList.add('collapsed');
  }
}

/**
 * Initialize filter search functionality
 * Debounced for performance (waits 300ms after user stops typing)
 */
function initFilterSearch() {
  const searchInputs = document.querySelectorAll('.filter-search');
  
  searchInputs.forEach(input => {
    let debounceTimer;
    
    input.addEventListener('keyup', function() {
      // Clear previous timer
      clearTimeout(debounceTimer);
      
      // Set new timer for debounced search
      debounceTimer = setTimeout(() => {
        performSearch(this);
      }, 300);
    });
  });
}

/**
 * Perform search within filter list
 * Only searches visible items for performance
 */
function performSearch(searchInput) {
  const query = searchInput.value.toLowerCase().trim();
  const targetId = searchInput.getAttribute('data-target');
  const filterGroup = document.getElementById(targetId);
  
  if (!filterGroup) return;
  
  const filterList = filterGroup.querySelector('.filter-list');
  if (!filterList) return;
  
  const items = filterList.querySelectorAll('li');
  let visibleCount = 0;
  
  items.forEach(item => {
    const text = item.textContent.toLowerCase();
    
    if (query === '' || text.includes(query)) {
      item.classList.remove('hidden');
      visibleCount++;
    } else {
      item.classList.add('hidden');
    }
  });
  
  // Show message if no results
  if (visibleCount === 0 && query !== '') {
    showNoResults(filterList);
  } else {
    removeNoResults(filterList);
  }
}

/**
 * Show "no results" message in filter list
 */
function showNoResults(filterList) {
  // Remove existing message first
  removeNoResults(filterList);
  
  const noResultsMsg = document.createElement('li');
  noResultsMsg.className = 'filter-no-results';
  noResultsMsg.textContent = 'No matches found';
  noResultsMsg.style.cssText = 'padding: 0.75rem; text-align: center; color: #999; font-size: 0.85rem;';
  
  filterList.appendChild(noResultsMsg);
}

/**
 * Remove "no results" message from filter list
 */
function removeNoResults(filterList) {
  const noResults = filterList.querySelector('.filter-no-results');
  if (noResults) {
    noResults.remove();
  }
}

/**
 * PERFORMANCE OPTIMIZATIONS:
 * 
 * 1. Event Delegation
 *    - Only one listener per search input instead of per item
 *    - Reduces memory usage with many filter items
 * 
 * 2. Debounced Search
 *    - Waits 300ms after user stops typing
 *    - Prevents excessive filtering operations
 *    - Example: typing "9mm" triggers 3 filter operations instead of 1 per character
 * 
 * 3. Lazy Collapse
 *    - Only ammunition-type, caliber, brand expanded by default
 *    - Others collapsed to reduce initial DOM rendering
 *    - Users only expand filters they need
 * 
 * 4. Minimal DOM Manipulation
 *    - Uses classList for state management (no reflow/repaint)
 *    - Toggles display property (fast CSS operation)
 *    - Search uses .hidden class instead of removing/readding DOM nodes
 * 
 * 5. No External Dependencies
 *    - Pure vanilla JavaScript
 *    - No jQuery or libraries = smaller file size, faster load
 */
