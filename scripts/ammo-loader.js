// ammo-loader.js
// Modular Gunworks — Updated Loader for New ammo-data.json Structure
// Supports categories: rimfire → handgun → rifle → shotgun (in this order)

async function loadAmmoData() {
  try {
    const response = await fetch("ammo-data.json");
    const data = await response.json();

    // Category order defined by Michael (Option D)
    const categoryOrder = ["rimfire", "handgun", "rifle", "shotgun"];

    const container = document.getElementById("ammo-container");
    container.innerHTML = ""; // Clear existing content

    categoryOrder.forEach(category => {
      if (!data[category] || data[category].length === 0) return;

      // Create category header
      const section = document.createElement("section");
      section.classList.add("ammo-section");

      const header = document.createElement("h2");
      header.textContent = category.charAt(0).toUpperCase() + category.slice(1);
      section.appendChild(header);

      // Create product grid
      const grid = document.createElement("div");
      grid.classList.add("ammo-grid");

      data[category].forEach(item => {
        const card = document.createElement("div");
        card.classList.add("ammo-card");

        // Image fallback
        const img = document.createElement("img");
        img.src = item.image || "images/ammo/placeholder.jpg";
        img.alt = item.title;
        card.appendChild(img);

        // Title
        const title = document.createElement("h3");
        title.textContent = item.title;
        card.appendChild(title);

        // Brand + Caliber
        const meta = document.createElement("p");
        meta.classList.add("ammo-meta");
        meta.textContent = `${item.brand} • ${item.caliber}`;
        card.appendChild(meta);

        // Grain + Bullet Type
        const details = document.createElement("p");
        details.classList.add("ammo-details");
        details.textContent = `${item.grain}gr • ${item.bullet_type}`;
        card.appendChild(details);

        // Price
        const price = document.createElement("p");
        price.classList.add("ammo-price");
        price.textContent = `$${item.price.toFixed(2)}`;
        card.appendChild(price);

        // Add to grid
        grid.appendChild(card);
      });

      section.appendChild(grid);
      container.appendChild(section);
    });

  } catch (error) {
    console.error("Error loading ammo data:", error);
    document.getElementById("ammo-container").innerHTML =
      "<p class='error'>Failed to load ammunition data.</p>";
  }
}

// Initialize loader
document.addEventListener("DOMContentLoaded", loadAmmoData);
