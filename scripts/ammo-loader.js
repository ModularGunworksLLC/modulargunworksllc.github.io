document.addEventListener("DOMContentLoaded", () => {
  const handgunGrid = document.querySelector("#handgun-ammo .ammo-grid");
  const rifleGrid = document.querySelector("#rifle-ammo .ammo-grid");
  const rimfireGrid = document.querySelector("#rimfire-ammo .ammo-grid");
  const shotgunGrid = document.querySelector("#shotgun-ammo .ammo-grid");
  const specialtyGrid = document.querySelector("#specialty-ammo .ammo-grid");

  fetch("../data/ammo-data.json")
    .then(response => response.json())
    .then(data => {
      data.forEach(item => {
        const card = buildAmmoCard(item);

        switch (item.category) {
          case "handgun":
            handgunGrid.appendChild(card);
            break;
          case "rifle":
            rifleGrid.appendChild(card);
            break;
          case "rimfire":
            rimfireGrid.appendChild(card);
            break;
          case "shotgun":
            shotgunGrid.appendChild(card);
            break;
          case "specialty":
            specialtyGrid.appendChild(card);
            break;
        }
      });
    })
    .catch(err => console.error("Error loading ammo data:", err));
});

function buildAmmoCard(item) {
  const card = document.createElement("article");
  card.className = "ammo-card";

  card.innerHTML = `
    <a href="${item.url}" class="ammo-card-image-link">
      <div class="ammo-card-image">
        <img src="${item.image}" alt="${item.title}">
      </div>
    </a>

    <div class="ammo-card-body">
      <h3 class="ammo-card-title">${item.title}</h3>
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
        <a href="${item.url}" class="ammo-card-button">View Details</a>
      </div>
    </div>
  `;

  return card;
}
