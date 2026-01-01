// ======================================================
// CONFIG
// ======================================================
const PAGE_SIZE = 24;

// ======================================================
// LOAD JSON
// ======================================================
async function loadMagazines() {
  const response = await fetch("../Data/magazines-data.json");
  const data = await response.json();
  return data;
}

// ======================================================
// GET STOCK IMAGE FOR PRODUCT
// ======================================================
function getStockImage(item) {
  // Map brands to relevant stock image keywords
  const imageMap = {
    "Glock": "glock-magazine,pistol-magazine",
    "Magpul": "pmag,ar15-magazine",
    "Sig Sauer": "sig-magazine,pistol-magazine",
    "Remington": "remington-magazine,shotgun-magazine",
    "Century Arms": "ak-magazine,rifle-magazine",
    "Mossberg": "mossberg-magazine,shotgun-magazine",
    "Ruger": "ruger-magazine,.22-magazine",
    "Smith & Wesson": "smith-wesson-magazine,pistol-magazine",
    "Beta": "drum-magazine,ar15-drum",
    "Colt": "colt-magazine,1911-magazine",
    "FN America": "fn-magazine,pistol-magazine",
    "Springfield Armory": "springfield-magazine,pistol-magazine",
    "CZ": "cz-magazine,pistol-magazine",
    "Beretta": "beretta-magazine,pistol-magazine",
    "Heckler & Koch": "hk-magazine,pistol-magazine",
    "Taurus": "taurus-magazine,pistol-magazine",
    "Walther": "walther-magazine,pistol-magazine",
    "Browning": "browning-magazine,pistol-magazine",
    "Savage": "savage-magazine,rifle-magazine"
  };

  const brand = item.brand;
  const keyword = imageMap[brand] || "magazine,ammo-magazine";

  // Use Unsplash for high-quality stock images
  return `https://source.unsplash.com/featured/300x200/?${encodeURIComponent(keyword)}`;
}

// ======================================================
// BUILD PRODUCT CARD
// ======================================================
function buildCard(item) {
  const inStock = item.in_stock !== false;
  const stockLabel = inStock ? "In Stock" : "Out of Stock";

  const rating = item.rating || 4.5;
  const reviewCount = item.reviews || 100;
  const stars = '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));

  return `
    <article class="magazines-card ${inStock ? "" : "magazines-out-of-stock"}">
      <a href="magazine-product.html?id=${item.id}" class="magazines-card-image-link">
        <div class="magazines-card-image">
          <img src="${getStockImage(item)}" alt="${item.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x200/333/fff?text=${encodeURIComponent(item.brand)}'">
        </div>
      </a>
      <div class="magazines-card-content">
        <h3 class="magazines-card-title">${item.title}</h3>
        <div class="magazines-card-brand">${item.brand}</div>
        <div class="magazines-rating">
          <span class="stars">${stars}</span>
          <span class="rating-count">(${reviewCount})</span>
        </div>
        <p class="magazines-card-meta">${item.type} • ${item.caliber} • ${item.capacity} rounds</p>
        <div class="magazines-card-price">
          <span class="magazines-price-main">$${item.price.toFixed(2)}</span>
        </div>
        <button class="magazines-card-button" onclick="addToCart('${item.id}')">ADD TO CART</button>
      </div>
    </article>
  `;
}

// ======================================================
// POPULATE FILTER LISTS WITH TOP 20 + MORE
// ======================================================
function populateFilterLists(allItems) {
  const unique = (arr) => [...new Set(arr)].sort();

  const brands = unique(allItems.map(i => i.brand));
  const calibers = unique(allItems.map(i => i.caliber));

  // Top 20 brands
  const topBrands = brands.slice(0, 20);
  const brandList = document.getElementById("brand-list");
  brandList.innerHTML = topBrands
    .map(brand => `<li><label><input type="checkbox" data-brand="${brand}"> ${brand}</label></li>`)
    .join("");

  if (brands.length > 20) {
    const moreBrands = brands.slice(20);
    const moreBtn = document.querySelector('button[data-filter="brand"]');
    moreBtn.style.display = 'block';
    moreBtn.addEventListener('click', () => {
      moreBrands.forEach(brand => {
        const li = document.createElement('li');
        li.innerHTML = `<label><input type="checkbox" data-brand="${brand}"> ${brand}</label>`;
        brandList.appendChild(li);
      });
      moreBtn.style.display = 'none';
    });
  }

  // Top 20 calibers
  const topCalibers = calibers.slice(0, 20);
  const caliberList = document.getElementById("caliber-list");
  caliberList.innerHTML = topCalibers
    .map(caliber => `<li><label><input type="checkbox" data-caliber="${caliber}"> ${caliber}</label></li>`)
    .join("");

  if (calibers.length > 20) {
    const moreCalibers = calibers.slice(20);
    const moreBtn = document.querySelector('button[data-filter="caliber"]');
    moreBtn.style.display = 'block';
    moreBtn.addEventListener('click', () => {
      moreCalibers.forEach(caliber => {
        const li = document.createElement('li');
        li.innerHTML = `<label><input type="checkbox" data-caliber="${caliber}"> ${caliber}</label>`;
        caliberList.appendChild(li);
      });
      moreBtn.style.display = 'none';
    });
  }
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
  const capacities = checkedDatasets("input[data-capacity]");
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

  // Capacity ranges
  if (capacities.length) {
    filtered = filtered.filter(i =>
      capacities.some(c => {
        const [min, max] = c.capacity.split("-").map(Number);
        return i.capacity >= min && i.capacity <= max;
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
  if (sort === "capacity-asc") sorted.sort((a, b) => a.capacity - b.capacity);
  if (sort === "capacity-desc") sorted.sort((a, b) => b.capacity - a.capacity);

  return sorted;
}

// ======================================================
// MAIN INITIALIZER
// ======================================================
loadMagazines().then(allItems => {
  populateFilterLists(allItems);

  let currentPage = 1;

  function updatePage() {
    let filtered = applyFilters(allItems);
    filtered = applySorting(filtered);

    const totalResults = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalResults / PAGE_SIZE));

    if (currentPage > totalPages) currentPage = totalPages;

    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const pageItems = filtered.slice(startIndex, startIndex + PAGE_SIZE);

    document.querySelector(".ammo-result-count").textContent =
      `Showing ${pageItems.length} of ${totalResults} results`;

    const grid = document.getElementById("ammo-unified-grid");
    grid.innerHTML = pageItems.map(buildCard).join("");
  }

  // Initial render
  updatePage();

  // Event listeners
  document.addEventListener("change", (e) => {
    if (e.target.matches("input[type=checkbox]")) {
      currentPage = 1;
      updatePage();
    }
  });

  document.getElementById("sort-by").addEventListener("change", () => {
    currentPage = 1;
    updatePage();
  });
});

// ======================================================
// ADD TO CART FUNCTION
// ======================================================
function addToCart(productId) {
  alert(`Added ${productId} to cart! (Demo - not functional yet)`);
}