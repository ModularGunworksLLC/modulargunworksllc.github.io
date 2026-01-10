// ======================================================
// CONFIG
// ======================================================
const PAGE_SIZE = 24;

// ======================================================
// BUILD LOADING SKELETON
// ======================================================
function buildSkeletonCard() {
  return `
    <article class="guns-card grid-card skeleton-card">
      <div class="guns-card-image skeleton skeleton-image"></div>
      <div class="guns-card-content">
        <div class="skeleton skeleton-title"></div>
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
// LOAD JSON - WITH RSR GROUP INTEGRATION
// ======================================================
// Initialize the universal product loader for guns category
let productLoader;

document.addEventListener('DOMContentLoaded', function() {
  productLoader = new ProductLoader({
    category: 'guns',
    pageSize: 24
  });
});

// ======================================================

// ======================================================
async function loadFromRSRGroup() {
  // RSR Group URLs for firearms:
  // Handguns: https://www.rsrgroup.com/search?Category=1
  // Rifles: https://www.rsrgroup.com/search?Category=5
  // Shotguns: https://www.rsrgroup.com/search?Category=3 (assumed)

  // Note: Direct fetching from RSR Group would require CORS proxy or backend
  // For now, return null to use static data
  return null;

  /*
  // Example implementation (would need CORS proxy):
  const handgunResponse = await fetch('https://cors-proxy.example.com/https://www.rsrgroup.com/search?Category=1');
  const rifleResponse = await fetch('https://cors-proxy.example.com/https://www.rsrgroup.com/search?Category=5');
  const shotgunResponse = await fetch('https://cors-proxy.example.com/https://www.rsrgroup.com/search?Category=3');

  const handguns = await handgunResponse.json();
  const rifles = await rifleResponse.json();
  const shotguns = await shotgunResponse.json();

  // Transform RSR Group data to our format
  return [
    ...transformRSRData(handguns, 'handgun'),
    ...transformRSRData(rifles, 'rifle'),
    ...transformRSRData(shotguns, 'shotgun')
  ];
  */
}

// ======================================================

// ======================================================
function transformRSRData(rsrItems, category) {
  // Transform RSR Group product format to our internal format
  return rsrItems.map(item => ({
    id: item.sku || item.id,
    title: item.name || item.title,
    brand: item.brand || item.manufacturer,
    type: category,
    caliber: item.caliber || item.gauge,
    price: parseFloat(item.price) || 0,
    description: item.description,
    rating: item.rating || 4.5,
    reviews: item.reviewCount || 0,
    in_stock: item.inStock !== false
  }));
}

// ======================================================
// GET STOCK IMAGE FOR PRODUCT
// ======================================================
function getStockImage(item) {
  // Map types and brands to relevant stock image keywords
  const imageMap = {
    // Handguns
    "Glock": "glock-pistol,handgun",
    "Sig Sauer": "sig-sauer-pistol,handgun",
    "Smith & Wesson": "smith-wesson-pistol,handgun",
    "Ruger": "ruger-pistol,revolver",
    "Colt": "colt-1911,handgun",
    "Beretta": "beretta-pistol,handgun",
    "Heckler & Koch": "hk-pistol,handgun",
    "Springfield Armory": "springfield-pistol,handgun",
    "CZ": "cz-pistol,handgun",
    "FN America": "fn-pistol,handgun",
    "Taurus": "taurus-pistol,handgun",
    "Kimber": "kimber-pistol,handgun",
    "Walther": "walther-pistol,handgun",
    "Browning": "browning-pistol,handgun",

    // Rifles
    "Palmetto State Armory": "ar-15-rifle,rifle",
    "Century Arms": "ak-47-rifle,rifle",
    "Winchester": "winchester-rifle,lever-action",
    "DPMS": "ar-15-rifle,rifle",
    "Savage": "savage-rifle,bolt-action",
    "Weatherby": "weatherby-rifle,rifle",
    "Marlin": "marlin-rifle,lever-action",

    // Shotguns
    "Remington": "remington-shotgun,pump-action",
    "Mossberg": "mossberg-shotgun,pump-action",
    "Benelli": "benelli-shotgun,semi-automatic"
  };

  const brand = item.brand;
  const keyword = imageMap[brand] || "firearm,gun";

  // Use Unsplash for high-quality stock images
  return `https://source.unsplash.com/featured/300x200/?${encodeURIComponent(keyword)}`;
}

// ======================================================
// BUILD PRODUCT CARD (GRID VIEW)
// ======================================================
function buildGridCard(item) {
  const inStock = item.in_stock !== false;
  const stockLabel = inStock ? "In Stock" : "Out of Stock";

  const rating = item.rating || 4.5;
  const reviewCount = item.reviews || 100;
  const stars = '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));

  return `
    <article class="guns-card grid-card ${inStock ? "" : "guns-out-of-stock"}">
      <a href="gun-product.html?id=${item.id}" class="guns-card-image-link">
        <div class="guns-card-image">
          <img src="${getStockImage(item)}" alt="${item.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x200/333/fff?text=${encodeURIComponent(item.brand)}'">
        </div>
      </a>
      <div class="guns-card-content">
        <h3 class="guns-card-title">${item.title}</h3>
        <div class="guns-card-brand">${item.brand}</div>
        <div class="guns-rating">
          <span class="stars">${stars}</span>
          <span class="rating-count">(${reviewCount})</span>
        </div>
        <p class="guns-card-meta">${item.type} • ${item.caliber}</p>
        <div class="guns-card-price">
          <span class="guns-price-main">$${item.price.toFixed(2)}</span>
        </div>
        <button class="guns-card-button" onclick="addToCart('${item.id}')">ADD TO CART</button>
      </div>
    </article>
  `;
}

// ======================================================
// BUILD PRODUCT CARD (LIST VIEW)
// ======================================================
function buildListCard(item) {
  const inStock = item.in_stock !== false;
  const stockLabel = inStock ? "In Stock" : "Out of Stock";

  const rating = item.rating || 4.5;
  const reviewCount = item.reviews || 100;
  const stars = '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));

  return `
    <article class="guns-card list-card ${inStock ? "" : "guns-out-of-stock"}">
      <a href="gun-product.html?id=${item.id}" class="guns-card-image-link">
        <div class="guns-card-image">
          <img src="${getStockImage(item)}" alt="${item.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/150x150/333/fff?text=${encodeURIComponent(item.brand)}'">
        </div>
      </a>
      <div class="guns-card-content">
        <div class="list-content-wrapper">
          <div class="list-details">
            <h3 class="guns-card-title">${item.title}</h3>
            <div class="guns-card-brand">${item.brand}</div>
            <div class="guns-rating">
              <span class="stars">${stars}</span>
              <span class="rating-count">(${reviewCount})</span>
            </div>
            <p class="guns-card-meta">${item.type} • ${item.caliber} • ${stockLabel}</p>
          </div>
          <div class="list-actions">
            <div class="guns-card-price">
              <span class="guns-price-main">$${item.price.toFixed(2)}</span>
            </div>
            <button class="guns-card-button" onclick="addToCart('${item.id}')">ADD TO CART</button>
          </div>
        </div>
      </div>
    </article>
  `;
}

// ======================================================
// GET STOCK IMAGE FOR PRODUCT
// ======================================================
function getStockImage(item) {
  // Map types and brands to relevant stock image keywords
  const imageMap = {
    // Handguns
    "Glock": "glock-pistol,handgun",
    "Sig Sauer": "sig-sauer-pistol,handgun",
    "Smith & Wesson": "smith-wesson-pistol,handgun",
    "Ruger": "ruger-pistol,revolver",
    "Colt": "colt-1911,handgun",
    "Beretta": "beretta-pistol,handgun",
    "Heckler & Koch": "hk-pistol,handgun",
    "Springfield Armory": "springfield-pistol,handgun",
    "CZ": "cz-pistol,handgun",
    "FN America": "fn-pistol,handgun",
    "Taurus": "taurus-pistol,handgun",
    "Kimber": "kimber-pistol,handgun",
    "Walther": "walther-pistol,handgun",
    "Browning": "browning-pistol,handgun",

    // Rifles
    "Palmetto State Armory": "ar-15-rifle,rifle",
    "Century Arms": "ak-47-rifle,rifle",
    "Winchester": "winchester-rifle,lever-action",
    "DPMS": "ar-15-rifle,rifle",
    "Savage": "savage-rifle,bolt-action",
    "Weatherby": "weatherby-rifle,rifle",
    "Marlin": "marlin-rifle,lever-action",

    // Shotguns
    "Remington": "remington-shotgun,pump-action",
    "Mossberg": "mossberg-shotgun,pump-action",
    "Benelli": "benelli-shotgun,semi-automatic"
  };

  const brand = item.brand;
  const keyword = imageMap[brand] || "firearm,gun";

  // Use Unsplash for high-quality stock images
  return `https://source.unsplash.com/featured/300x200/?${encodeURIComponent(keyword)}`;
}

// ======================================================
// BUILD PRODUCT CARD (GRID VIEW)
// ======================================================
function buildGridCard(item) {
  const inStock = item.in_stock !== false;
  const stockLabel = inStock ? "In Stock" : "Out of Stock";

  const rating = item.rating || 4.5;
  const reviewCount = item.reviews || 100;
  const stars = '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));

  return `
    <article class="guns-card grid-card ${inStock ? "" : "guns-out-of-stock"}">
      <a href="gun-product.html?id=${item.id}" class="guns-card-image-link">
        <div class="guns-card-image">
          <img src="${getStockImage(item)}" alt="${item.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x200/333/fff?text=${encodeURIComponent(item.brand)}'">
        </div>
      </a>
      <div class="guns-card-content">
        <h3 class="guns-card-title">${item.title}</h3>
        <div class="guns-card-brand">${item.brand}</div>
        <div class="guns-rating">
          <span class="stars">${stars}</span>
          <span class="rating-count">(${reviewCount})</span>
        </div>
        <p class="guns-card-meta">${item.type} • ${item.caliber}</p>
        <div class="guns-card-price">
          <span class="guns-price-main">$${item.price.toFixed(2)}</span>
        </div>
        <button class="guns-card-button" onclick="addToCart('${item.id}')">ADD TO CART</button>
      </div>
    </article>
  `;
}

// ======================================================
// BUILD PRODUCT CARD (LIST VIEW)
// ======================================================
function buildListCard(item) {
  const inStock = item.in_stock !== false;
  const stockLabel = inStock ? "In Stock" : "Out of Stock";

  const rating = item.rating || 4.5;
  const reviewCount = item.reviews || 100;
  const stars = '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));

  return `
    <article class="guns-card list-card ${inStock ? "" : "guns-out-of-stock"}">
      <a href="gun-product.html?id=${item.id}" class="guns-card-image-link">
        <div class="guns-card-image">
          <img src="${getStockImage(item)}" alt="${item.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/150x150/333/fff?text=${encodeURIComponent(item.brand)}'">
        </div>
      </a>
      <div class="guns-card-content">
        <div class="list-content-wrapper">
          <div class="list-details">
            <h3 class="guns-card-title">${item.title}</h3>
            <div class="guns-card-brand">${item.brand}</div>
            <div class="guns-rating">
              <span class="stars">${stars}</span>
              <span class="rating-count">(${reviewCount})</span>
            </div>
            <p class="guns-card-meta">${item.type} • ${item.caliber} • ${stockLabel}</p>
          </div>
          <div class="list-actions">
            <div class="guns-card-price">
              <span class="guns-price-main">$${item.price.toFixed(2)}</span>
            </div>
            <button class="guns-card-button" onclick="addToCart('${item.id}')">ADD TO CART</button>
          </div>
        </div>
      </div>
    </article>
  `;
}

// ======================================================
// BUILD PRODUCTS GRID/LIST
// ======================================================
function buildProductsGrid(items, currentPage, totalPages, viewMode = 'grid') {
  const container = document.getElementById("guns-products");
  const buildCard = viewMode === 'list' ? buildListCard : buildGridCard;

  container.className = `guns-products ${viewMode}-view`;
  container.innerHTML = items.map(buildCard).join("");

  // Update pagination
  const pagination = document.getElementById("guns-pagination");
  const pageInfo = document.getElementById("page-info");
  const prevBtn = pagination.querySelector('.prev-btn');
  const nextBtn = pagination.querySelector('.next-btn');

  pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
  prevBtn.disabled = currentPage <= 1;
  nextBtn.disabled = currentPage >= totalPages;
}

// ======================================================
// BUILD CATEGORY SECTIONS (TOP OF PAGE)
// ======================================================
function buildCategorySections(filteredItems) {
  const container = document.getElementById("category-sections");
  container.innerHTML = "";

  const order = ["handgun", "rifle", "shotgun"];
  const MAX_PER_SECTION = 6; // Limit to prevent lag

  order.forEach(category => {
    const sectionItems = filteredItems.filter(i => i.type === category);
    if (sectionItems.length === 0) return;

    const displayItems = sectionItems.slice(0, MAX_PER_SECTION);
    const hasMore = sectionItems.length > MAX_PER_SECTION;

    const section = document.createElement("section");
    section.className = "guns-section";
    section.id = `${category}-guns`;

    section.innerHTML = `
      <h2>${category.charAt(0).toUpperCase() + category.slice(1)}s</h2>
      <div class="guns-grid">
        ${displayItems.map(buildGridCard).join("")}
      </div>
      ${hasMore ? `<button class="show-more-btn" onclick="showMoreGunsCategory('${category}')">Show ${sectionItems.length - MAX_PER_SECTION} More</button>` : ''}
    `;

    container.appendChild(section);
  });
}

// ======================================================
// SHOW MORE ITEMS IN GUNS CATEGORY
// ======================================================
function showMoreGunsCategory(category) {
  const section = document.getElementById(`${category}-guns`);
  const grid = section.querySelector('.guns-grid');
  const button = section.querySelector('.show-more-btn');

  // Get all items for this category
  const allItems = window.allGunsData || [];
  const categoryItems = allItems.filter(i => i.type === category);

  // Show all items
  grid.innerHTML = categoryItems.map(buildGridCard).join("");
  button.remove();
}

// ======================================================
// POPULATE FILTER LISTS
// ======================================================
function populateFilterLists(allItems) {
  const unique = (arr) => [...new Set(arr)].sort();

  const brands = unique(allItems.map(i => i.brand));
  const types = unique(allItems.map(i => i.type));
  const calibers = unique(allItems.map(i => i.caliber));

  const fill = (id, values, attr) => {
    const ul = document.querySelector(`#${id} .filter-list`);
    if (!ul) return;
    ul.innerHTML = values
      .map(v => `<li><label><input type="checkbox" data-${attr}="${v}"> ${v}</label></li>`)
      .join("");
  };

  fill("filter-type", types, "type");
  fill("filter-brand", brands, "brand");
  fill("filter-caliber", calibers, "caliber");
}

// ======================================================
// FILTER ENGINE
// ======================================================
function applyFilters(allItems) {
  let filtered = [...allItems];

  const checkedDatasets = (selector) =>
    [...document.querySelectorAll(selector + ":checked")].map(cb => cb.dataset);

  const brands = checkedDatasets("input[data-brand]");
  const types = checkedDatasets("input[data-type]");
  const calibers = checkedDatasets("input[data-caliber]");
  const prices = checkedDatasets("input[data-price]");
  const inStockOnly = document.getElementById("filter-in-stock")?.checked;

  // Brand
  if (brands.length) {
    filtered = filtered.filter(i =>
      brands.some(b => b.brand === i.brand)
    );
  }

  // Type
  if (types.length) {
    filtered = filtered.filter(i =>
      types.some(t => t.type === i.type)
    );
  }

  // Caliber
  if (calibers.length) {
    filtered = filtered.filter(i =>
      calibers.some(c => c.caliber === i.caliber)
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

  // In stock only
  if (inStockOnly) {
    filtered = filtered.filter(i => i.in_stock !== false);
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
  if (sort === "rating") sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  if (sort === "newest") sorted.sort((a, b) => (b.id || '').localeCompare(a.id || ''));

  return sorted;
}


// ======================================================
// MAIN INITIALIZER
// ======================================================
// Removed: all initialization is now handled by universal-product-loader.js