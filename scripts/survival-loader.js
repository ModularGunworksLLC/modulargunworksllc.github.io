// ======================================================
// CONFIG
// ======================================================
const PAGE_SIZE = 24; // industry-standard default for grid pages

// ======================================================
// LOAD JSON
// ======================================================
async function loadSurvival() {
  const response = await fetch("../Data/survival-data.json");
  const data = await response.json();
  return data;
}

// ======================================================
// GET STOCK IMAGE FOR PRODUCT
// ======================================================
function getStockImage(item) {
  // Map survival types to relevant stock image keywords
  const imageMap = {
    "Food": "emergency-food,mre,survival-food",
    "Water Purification": "water-filter,survival-water",
    "Knife": "survival-knife,tactical-knife",
    "Medical": "first-aid-kit,medical-supplies",
    "Power": "solar-panel,survival-power",
    "Communication": "emergency-radio,survival-radio"
  };

  const type = item.type;
  const keyword = imageMap[type] || "survival-gear,emergency-preparedness";

  // Use Unsplash for high-quality stock images
  return `https://source.unsplash.com/featured/300x200/?${encodeURIComponent(keyword)}`;
}

// ======================================================
// BUILD SURVIVAL CARD
// ======================================================
function buildCard(item) {
  const inStock =
    item.in_stock === undefined
      ? true
      : !!item.in_stock;

  const stockLabel = inStock ? "In Stock" : "Out of Stock";

  // Add sample rating
  const rating = item.rating || Math.floor(Math.random() * 2) + 4;
  const reviewCount = item.reviews || Math.floor(Math.random() * 50) + 10;

  const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);

  return `
    <article class="ammo-card ${inStock ? "" : "ammo-out-of-stock"}">
      <a href="ammo-product.html?id=${item.id}" class="ammo-card-image-link">
        <div class="ammo-card-image">
          <img src="${getStockImage(item)}" alt="${item.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x200/333/fff?text=${encodeURIComponent(item.type)}'">
        </div>
      </a>
      <div class="ammo-card-body">
        <h3 class="ammo-card-title">${item.title}</h3>
        <div class="ammo-rating">
          <span class="stars">${stars}</span>
          <span class="review-count">(${reviewCount})</span>
        </div>
        <p class="ammo-card-meta">${item.brand} • ${item.type}</p>
        <ul class="ammo-card-specs">
          ${item.shelf_life ? `<li><strong>Shelf Life:</strong> ${item.shelf_life}</li>` : ''}
          ${item.capacity ? `<li><strong>Capacity:</strong> ${item.capacity}</li>` : ''}
          ${item.calories ? `<li><strong>Calories:</strong> ${item.calories}</li>` : ''}
          ${item.filter_life ? `<li><strong>Filter Life:</strong> ${item.filter_life}</li>` : ''}
          ${item.blade_length ? `<li><strong>Blade Length:</strong> ${item.blade_length}</li>` : ''}
          ${item.pieces ? `<li><strong>Pieces:</strong> ${item.pieces}</li>` : ''}
          ${item.output ? `<li><strong>Output:</strong> ${item.output}</li>` : ''}
          ${item.power_sources ? `<li><strong>Power:</strong> ${item.power_sources}</li>` : ''}
          <li><strong>Status:</strong> ${stockLabel}</li>
        </ul>
        <div class="ammo-card-footer">
          <div class="ammo-card-price">
            <span class="ammo-price-main">$${item.price.toFixed(2)}</span>
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

  const brands = unique(allItems.map(i => i.brand));
  const types = unique(allItems.map(i => i.type));

  const fill = (id, values, attr) => {
    const ul = document.querySelector(`#${id} .filter-list`);
    if (!ul) return;
    ul.innerHTML = values
      .map(v => `<li><label><input type="checkbox" data-${attr}="${v}"> ${v}</label></li>`)
      .join("");
  };

  fill("filter-type", types, "type");
  fill("filter-brand", brands, "brand");
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
  const prices = checkedDatasets("input[data-price]");
  const inStockOnly = document.getElementById("filter-in-stock")?.checked;

  // Type
  if (types.length) {
    filtered = filtered.filter(i =>
      types.some(t => t.type === i.type)
    );
  }

  // Brand
  if (brands.length) {
    filtered = filtered.filter(i =>
      brands.some(b => b.brand === i.brand)
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
    filtered = filtered.filter(i => {
      if (i.in_stock !== undefined) return !!i.in_stock;
      return true;
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

  return sorted;
}

// ======================================================
// URL PARAMETER SYNC
// ======================================================
function applyURLParams() {
  const params = new URLSearchParams(window.location.search);

  params.forEach((value, key) => {
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
loadSurvival().then(allItems => {
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
  alert(`Added ${productId} to cart! (Demo - not functional yet)`);
}