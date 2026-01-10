// Initialize the universal product loader for ammunition category
let productLoader;

document.addEventListener('DOMContentLoaded', function() {
  productLoader = new ProductLoader({
    category: 'ammunition',
    pageSize: 24
  });
});

// ======================================================
// BUILD LOADING SKELETON
// ======================================================
function buildSkeletonCard() {
  return `
    <article class="ammo-card skeleton-card">
      <div class="ammo-card-image skeleton skeleton-image"></div>
      <div class="ammo-card-body">
        <div class="skeleton skeleton-title"></div>
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-text"></div>
      </div>
    </article>
  `;
}

function showLoadingSkeleton(container, count = 6) {
  container.innerHTML = Array(count).fill().map(() => buildSkeletonCard()).join("");
}

// ======================================================
// GET STOCK IMAGE FOR PRODUCT
// ======================================================
function getStockImage(item) {
  // Map calibers to relevant stock image keywords
  const imageMap = {
    // Handgun
    "9mm": "9mm-ammo,handgun-ammunition",
    ".45 ACP": "45-acp-ammo,colt-1911",
    ".40 S&W": ".40-caliber-ammo,handgun",
    ".380 ACP": "380-acp-ammo,pocket-pistol",
    ".22 LR": "22-lr-ammo,rimfire-ammunition",
    ".38 Special": "38-special-ammo,revolver",
    ".357 Magnum": "357-magnum-ammo,revolver",
    "10mm": "10mm-ammo,handgun-ammunition",
    ".44 Magnum": "44-magnum-ammo,revolver",

    // Rifle
    "5.56x45mm": "556-ammo,ar-15-ammunition",
    ".223 Remington": "223-ammo,ar-15",
    "7.62x39mm": "762x39-ammo,ak-47-ammunition",
    ".308 Winchester": "308-ammo,rifle-ammunition",
    ".270 Winchester": "270-winchester-ammo,rifle",
    ".30-06 Springfield": "30-06-ammo,rifle-ammunition",
    ".300 Win Mag": "300-win-mag-ammo,rifle",
    "6.5 Creedmoor": "65-creedmoor-ammo,precision-rifle",

    // Shotgun
    "12 Gauge": "12-gauge-ammo,shotgun-shells",
    "20 Gauge": "20-gauge-ammo,shotgun",
    "410 Gauge": "410-gauge-ammo,shotgun",

    // Rimfire
    "17 HMR": "17-hmr-ammo,varmint-rifle",
    ".22 WMR": ".22-wmr-ammo,rimfire"
  };

  const caliber = item.caliber;
  const keyword = imageMap[caliber] || "ammunition,ammo";

  // Use Unsplash for high-quality stock images
  return `https://source.unsplash.com/featured/300x200/?${encodeURIComponent(keyword)}`;
}
function buildCard(item) {
  const inStock =
    item.in_stock === undefined
      ? true
      : !!item.in_stock; // default to true until RSR data

  const stockLabel = inStock ? "In Stock" : "Out of Stock";

  // Add sample rating (in real app, this would come from data)
  const rating = item.rating;
  const reviewCount = item.reviews;

  const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);

  // Deal badge if price is low
  const dealBadge = item.price < 20 ? '<div class="deal-badge">DEAL</div>' : '';
  // In stock badge
  const stockBadge = `<div class="ammo-stock-badge">${stockLabel}</div>`;

  return `
    <article class="ammo-card ${inStock ? "" : "ammo-out-of-stock"}">
      ${stockBadge}
      ${dealBadge}
      <a href="ammo-product.html?id=${item.id}" class="ammo-card-image-link">
        <div class="ammo-card-image">
          <img src="${getStockImage(item)}" alt="${item.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x200/333/fff?text=${encodeURIComponent(item.caliber)}'">
        </div>
      </a>
      <div class="ammo-card-body">
        <h3 class="ammo-card-title">${item.title}</h3>
        <div class="ammo-rating">
          <span class="stars">${stars}</span>
          <span class="review-count">(${reviewCount})</span>
        </div>
        <p class="ammo-card-meta">${item.brand} • ${item.case_material} • ${item.bullet_type}</p>
        <ul class="ammo-card-specs">
          <li><strong>Caliber:</strong> ${item.caliber}</li>
          <li><strong>Grain:</strong> ${item.grain} gr</li>
          <li><strong>Rounds:</strong> ${item.rounds}</li>
        </ul>
        <div class="ammo-card-footer">
          <div class="ammo-card-price">
            <span class="ammo-price-main">$${item.price.toFixed(2)}</span>
            <span class="ammo-price-sub">$${(item.price / item.rounds).toFixed(2)} / rd</span>
          </div>
          <button class="ammo-card-button" onclick="addToCart('${item.id}')">ADD TO CART</button>
        </div>
      </div>
    </article>
  `;
}

// ======================================================
// BUILD CATEGORY SECTIONS (TOP OF PAGE)
// ======================================================
function buildCategorySections(filteredItems) {
  const container = document.getElementById("category-sections");
  container.innerHTML = "";

  const order = ["rimfire", "handgun", "rifle", "shotgun"];
  const MAX_PER_SECTION = 6; // Limit to prevent lag

  order.forEach(category => {
    const sectionItems = filteredItems.filter(i => i.category === category);
    if (sectionItems.length === 0) return;

    const displayItems = sectionItems.slice(0, MAX_PER_SECTION);
    const hasMore = sectionItems.length > MAX_PER_SECTION;

    const section = document.createElement("section");
    section.className = "ammo-section";
    section.id = `${category}-ammo`;

    section.innerHTML = `
      <h2>${category.charAt(0).toUpperCase() + category.slice(1)} Ammunition</h2>
      <div class="ammo-grid">
        ${displayItems.map(buildCard).join("")}
      </div>
      ${hasMore ? `<button class="show-more-btn" onclick="showMoreCategory('${category}')">Show ${sectionItems.length - MAX_PER_SECTION} More</button>` : ''}
    `;

    container.appendChild(section);
  });
}

// ======================================================
// SHOW MORE ITEMS IN CATEGORY
// ======================================================
function showMoreCategory(category) {
  const section = document.getElementById(`${category}-ammo`);
  const grid = section.querySelector('.ammo-grid');
  const button = section.querySelector('.show-more-btn');

  // Get all items for this category
  const allItems = window.allAmmoData || [];
  const categoryItems = allItems.filter(i => i.category === category);

  // Show all items
  grid.innerHTML = categoryItems.map(buildCard).join("");
  button.remove();
}

// ======================================================
// BUILD BULK AMMO GRID
// ======================================================
function buildBulkAmmoGrid(allItems) {
  const bulkItems = allItems.filter(item => item.rounds >= 500); // Bulk packs
  const bulkGrid = document.getElementById("bulk-ammo-grid");

  if (bulkItems.length > 0) {
    bulkGrid.innerHTML = bulkItems.slice(0, 6).map(buildCard).join(""); // Show first 6
  } else {
    // Fallback to high-round items
    const highRoundItems = allItems.filter(item => item.rounds >= 100).slice(0, 6);
    bulkGrid.innerHTML = highRoundItems.map(buildCard).join("");
  }
}
function buildUnifiedGrid(items, currentPage, totalPages) {
  const grid = document.getElementById("ammo-unified-grid");
  grid.innerHTML = items.map(buildCard).join("");

  const pagination = document.getElementById("ammo-pagination");
  const pageInfo = pagination.querySelector(".page-info");
  const prevBtn = pagination.querySelector('button[data-page="prev"]');
  const nextBtn = pagination.querySelector('button[data-page="next"]');

  pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
  prevBtn.disabled = currentPage <= 1;
  nextBtn.disabled = currentPage >= totalPages;
}

// ======================================================
// AUTO-GENERATE FILTER LISTS
// ======================================================
// Filter lists are now populated by ammo-filters.js
function populateFilterLists(allItems) {
  // No-op: handled by ammo-filters.js
}

// ======================================================
// FILTER ENGINE
// ======================================================
// Filtering is now handled by ammo-filters.js; fallback to allItems if no filter is active
function applyFilters(allItems) {
  if (window.filteredAmmoData) {
    return window.filteredAmmoData;
  }
  return allItems;
}

// ======================================================
// SORT ENGINE
// ======================================================
function applySorting(items) {
  const sort = document.getElementById("sort-by").value;
  let sorted = [...items];

  if (sort === "price-asc") sorted.sort((a, b) => a.price - b.price);
  if (sort === "price-desc") sorted.sort((a, b) => b.price - a.price);
  if (sort === "grain-asc") sorted.sort((a, b) => a.grain - b.grain);
  if (sort === "grain-desc") sorted.sort((a, b) => b.grain - a.grain);

  // "featured" falls through to original ordering
  return sorted;
}

// ======================================================
// URL PARAMETER SYNC
// ======================================================
function applyURLParams() {
  const params = new URLSearchParams(window.location.search);

  params.forEach((value, key) => {
    // Example: ?caliber=9mm
    const selector = `input[data-${key}="${value}"]`;
    const el = document.querySelector(selector);
    if (el) el.checked = true;

    if (key === "in_stock" && value === "1") {
      const stockCheckbox = document.getElementById("filter-in-stock");
      if (stockCheckbox) stockCheckbox.checked = true;
    }
  });
}

// ======================================================
// SCROLL TO UNIFIED GRID
// ======================================================
function scrollToUnifiedGrid() {
  const header = document.querySelector(".ammo-unified-header");
  if (!header) return;
  const y = header.getBoundingClientRect().top + window.scrollY - 80;
  window.scrollTo({ top: y, behavior: "smooth" });
}

// ======================================================
// MAIN INITIALIZER
// ======================================================
loadAmmo().then(data => {
  const allItems = [
    ...data.rimfire,
    ...data.handgun,
    ...data.rifle,
    ...data.shotgun
  ];

  // Store globally for showMoreCategory function
  window.allAmmoData = allItems;

  populateFilterLists(allItems);
  buildBulkAmmoGrid(allItems); // Add bulk ammo section
  applyURLParams();

  let currentPage = 1;

  function updatePage({ scroll = false } = {}) {
    let filtered = applyFilters(allItems);
    filtered = applySorting(filtered);

    const totalResults = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalResults / PAGE_SIZE));

    if (currentPage > totalPages) currentPage = totalPages;

    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const pageItems = filtered.slice(startIndex, startIndex + PAGE_SIZE);

    document.querySelector(".ammo-result-count").textContent =
      `Showing ${pageItems.length} of ${totalResults} results`;

    buildCategorySections(filtered);      // sections show limited items
    buildUnifiedGrid(pageItems, currentPage, totalPages); // unified grid paginated

    if (scroll) scrollToUnifiedGrid();
  }

  // Initial render
  updatePage();

  // Listen for filter changes from ammo-filters.js
  document.addEventListener('ammoFiltersChanged', (e) => {
    currentPage = 1;
    updatePage({ scroll: true });
  });

  // Sorting
  document.getElementById("sort-by").addEventListener("change", () => {
    currentPage = 1;
    updatePage({ scroll: true });
  });

  // Pagination buttons
  const pagination = document.getElementById("ammo-pagination");
  const prevBtn = pagination.querySelector('button[data-page="prev"]');
  const nextBtn = pagination.querySelector('button[data-page="next"]');

  prevBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage -= 1;
      updatePage({ scroll: true });
    }
  });

  nextBtn.addEventListener("click", () => {
    currentPage += 1;
    updatePage({ scroll: true });
  });
});

// ======================================================
// ADD TO CART FUNCTION
// ======================================================
function addToCart(productId) {
  // Simple cart simulation - in real app, this would integrate with backend

}
