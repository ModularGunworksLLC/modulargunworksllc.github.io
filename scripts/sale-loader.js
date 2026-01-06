// ======================================================
// CONFIG
// ======================================================
const PAGE_SIZE = 24; // industry-standard default for grid pages

// ======================================================
// LOAD JSON
// ======================================================
async function loadSale() {
  // Add cache-busting query string to always fetch latest data
  const cacheBuster = Date.now();
  const response = await fetch(`../Data/sale-data.json?_=${cacheBuster}`);
  const data = await response.json();
  return data;
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

// ======================================================
// BUILD SALE CARD
// ======================================================
function buildCard(item) {
  const inStock =
    item.in_stock === undefined
      ? true
      : !!item.in_stock; // default to true until RSR data

  const stockLabel = inStock ? "In Stock" : "Out of Stock";

  // Add sample rating (in real app, this would come from data)
  const rating = item.rating || Math.floor(Math.random() * 2) + 4; // 4-5 stars randomly
  const reviewCount = item.reviews || Math.floor(Math.random() * 50) + 10;

  const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);

  // Sale badge
  const saleBadge = '<div class="sale-badge">SALE</div>';

  // Price display with original and sale price
  const originalPrice = item.original_price ? `<span class="original-price">$${item.original_price.toFixed(2)}</span>` : '';
  const pricePerRound = item.rounds ? `$${(item.price / item.rounds).toFixed(2)} / rd` : '';

  return `
    <article class="ammo-card ${inStock ? "" : "ammo-out-of-stock"}">
      ${saleBadge}
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
          ${item.grain ? `<li><strong>Grain:</strong> ${item.grain} gr</li>` : ''}
          <li><strong>Rounds:</strong> ${item.rounds}</li>
          <li><strong>Status:</strong> ${stockLabel}</li>
        </ul>
        <div class="ammo-card-footer">
          <div class="ammo-card-price">
            ${originalPrice}
            <span class="ammo-price-main">$${item.price.toFixed(2)}</span>
            ${pricePerRound ? `<span class="ammo-price-sub">${pricePerRound}</span>` : ''}
          </div>
          <button class="ammo-card-button" onclick="addToCart('${item.id}')">ADD TO CART</button>
        </div>
      </div>
    </article>
  `;
}

// ======================================================
// BUILD UNIFIED GRID
// ======================================================
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
function populateFilterLists(allItems) {
  const unique = (arr) => [...new Set(arr)].sort();

  const calibers = unique(allItems.map(i => i.caliber));
  const brands = unique(allItems.map(i => i.brand));
  const types = unique(allItems.map(i => i.bullet_type));
  const categories = unique(allItems.map(i => i.category));

  const fill = (id, values, attr) => {
    const ul = document.querySelector(`#${id} .filter-list`);
    if (!ul) return; // Skip if filter group doesn't exist
    ul.innerHTML = values
      .map(v => `<li><label><input type="checkbox" data-${attr}="${v}"> ${v}</label></li>`)
      .join("");
  };

  fill("filter-type", types, "type");
  fill("filter-brand", brands, "brand");
  fill("filter-category", categories, "category");
}

// ======================================================
// FILTER ENGINE
// ======================================================
function applyFilters(allItems) {
  let filtered = [...allItems];

  const checkedDatasets = (selector) =>
    [...document.querySelectorAll(selector + ":checked")].map(cb => cb.dataset);

  const types = checkedDatasets("input[data-type]");
  const brands = checkedDatasets("input[data-brand]");
  const categories = checkedDatasets("input[data-category]");
  const prices = checkedDatasets("input[data-price]");
  const inStockOnly = document.getElementById("filter-in-stock")?.checked;

  // Bullet Type
  if (types.length) {
    filtered = filtered.filter(i =>
      types.some(t => t.type === i.bullet_type)
    );
  }

  // Brand
  if (brands.length) {
    filtered = filtered.filter(i =>
      brands.some(b => b.brand === i.brand)
    );
  }

  // Category
  if (categories.length) {
    filtered = filtered.filter(i =>
      categories.some(c => c.category === i.category)
    );
  }

  // Price ranges
  if (prices.length) {
    filtered = filtered.filter(i =>
      prices.some(p => {
        const [min, max] = p.price.split("-").map(Number);
        return i.price >= min && i.price <= max;
      })
    );
  }

  // In stock only (future RSR integration)
  if (inStockOnly) {
    filtered = filtered.filter(i => {
      if (i.in_stock !== undefined) return !!i.in_stock;
      if (i.available_quantity !== undefined) return i.available_quantity > 0;
      return true; // default to in stock until we have real data
    });
  }

  return filtered;
}

// ======================================================
// SORT ENGINE
// ======================================================
function applySorting(items) {
  const sort = document.getElementById("sort-by").value;
  let sorted = [...items];

  if (sort === "price-asc") sorted.sort((a, b) => a.price - b.price);
  if (sort === "price-desc") sorted.sort((a, b) => b.price - a.price);

  // "featured" falls through to original ordering
  return sorted;
}

// ======================================================
// URL PARAMETER SYNC
// ======================================================
function applyURLParams() {
  const params = new URLSearchParams(window.location.search);

  params.forEach((value, key) => {
    // Example: ?brand=Federal
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
loadSale().then(allItems => {
  populateFilterLists(allItems);
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

    buildUnifiedGrid(pageItems, currentPage, totalPages);

    if (scroll) scrollToUnifiedGrid();
  }

  // Initial render
  updatePage();

  // Checkbox filters
  document.addEventListener("change", (e) => {
    if (e.target.matches("input[type=checkbox]")) {
      currentPage = 1;
      updatePage({ scroll: true });
    }
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
  alert(`Added ${productId} to cart! (Demo - not functional yet)`);
}