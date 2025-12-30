// ======================================================
// CONFIG
// ======================================================
const PAGE_SIZE = 24; // industry-standard default for grid pages

// ======================================================
// LOAD JSON
// ======================================================
async function loadAmmo() {
  const response = await fetch("../Data/ammo-data.json");
  const data = await response.json();
  return data;
}

// ======================================================
// BUILD PRODUCT CARD
// ======================================================
function buildCard(item) {
  const inStock =
    item.in_stock === undefined
      ? true
      : !!item.in_stock; // default to true until RSR data

  const stockLabel = inStock ? "In Stock" : "Out of Stock";

  return `
    <article class="ammo-card ${inStock ? "" : "ammo-out-of-stock"}">
      <a href="ammo-product.html?id=${item.id}" class="ammo-card-image-link">
        <div class="ammo-card-image">
          <img src="../${item.image}" alt="${item.title}">
        </div>
      </a>
      <div class="ammo-card-body">
        <h3 class="ammo-card-title">${item.title}</h3>
        <p class="ammo-card-meta">${item.brand} • ${item.case_material} • ${item.bullet_type}</p>
        <ul class="ammo-card-specs">
          <li><strong>Caliber:</strong> ${item.caliber}</li>
          <li><strong>Grain:</strong> ${item.grain} gr</li>
          <li><strong>Rounds:</strong> ${item.rounds}</li>
          <li><strong>Status:</strong> ${stockLabel}</li>
        </ul>
        <div class="ammo-card-footer">
          <div class="ammo-card-price">
            <span class="ammo-price-main">$${item.price.toFixed(2)}</span>
            <span class="ammo-price-sub">$${(item.price / item.rounds).toFixed(2)} / rd</span>
          </div>
          <a href="ammo-product.html?id=${item.id}" class="ammo-card-button">View Details</a>
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

  order.forEach(category => {
    const sectionItems = filteredItems.filter(i => i.category === category);
    if (sectionItems.length === 0) return;

    const section = document.createElement("section");
    section.className = "ammo-section";
    section.id = `${category}-ammo`;

    section.innerHTML = `
      <h2>${category.charAt(0).toUpperCase() + category.slice(1)} Ammunition</h2>
      <div class="ammo-grid">
        ${sectionItems.map(buildCard).join("")}
      </div>
    `;

    container.appendChild(section);
  });
}

// ======================================================
// BUILD UNIFIED GRID (PAGINATED)
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
  const cases = unique(allItems.map(i => i.case_material));

  const fill = (id, values, attr) => {
    const ul = document.querySelector(`#${id} .filter-list`);
    ul.innerHTML = values
      .map(v => `<li><label><input type="checkbox" data-${attr}="${v}"> ${v}</label></li>`)
      .join("");
  };

  fill("filter-caliber", calibers, "caliber");
  fill("filter-brand", brands, "brand");
  fill("filter-type", types, "type");
  fill("filter-case", cases, "case");
}

// ======================================================
// FILTER ENGINE
// ======================================================
function applyFilters(allItems) {
  let filtered = [...allItems];

  const checkedDatasets = (selector) =>
    [...document.querySelectorAll(selector + ":checked")].map(cb => cb.dataset);

  const calibers = checkedDatasets("input[data-caliber]");
  const brands = checkedDatasets("input[data-brand]");
  const types = checkedDatasets("input[data-type]");
  const cases = checkedDatasets("input[data-case]");
  const grains = checkedDatasets("input[data-grain]");
  const prices = checkedDatasets("input[data-price]");
  const inStockOnly = document.getElementById("filter-in-stock")?.checked;

  // Caliber
  if (calibers.length) {
    filtered = filtered.filter(i =>
      calibers.some(c => c.caliber === i.caliber)
    );
  }

  // Brand
  if (brands.length) {
    filtered = filtered.filter(i =>
      brands.some(b => b.brand === i.brand)
    );
  }

  // Bullet Type
  if (types.length) {
    filtered = filtered.filter(i =>
      types.some(t => t.type === i.bullet_type)
    );
  }

  // Case Material
  if (cases.length) {
    filtered = filtered.filter(i =>
      cases.some(c => c.case === i.case_material)
    );
  }

  // Grain ranges
  if (grains.length) {
    filtered = filtered.filter(i =>
      grains.some(g => {
        const [min, max] = g.grain.split("-").map(Number);
        return i.grain >= min && i.grain <= max;
      })
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

    buildCategorySections(filtered);      // sections show all filtered
    buildUnifiedGrid(pageItems, currentPage, totalPages); // unified grid paginated

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
