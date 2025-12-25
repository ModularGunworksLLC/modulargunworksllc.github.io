import os

# Define category pages and their starter content
categories = {
    "ammunition.md": "# Ammunition\n\nBrowse all ammunition categories at Modular Gunworks LLC.",
    "guns.md": "# Guns\n\nExplore handguns, rifles, shotguns, and more.",
    "magazines.md": "# Magazines\n\nFind magazines for pistols, rifles, and specialty platforms.",
    "gun-parts.md": "# Gun Parts\n\nShop AR parts, AK parts, triggers, barrels, and more.",
    "gear.md": "# Gear\n\nHolsters, slings, lights, bags, and tactical equipment.",
    "optics.md": "# Optics & Sights\n\nRed dots, scopes, magnifiers, night vision, and thermal.",
    "reloading.md": "# Reloading Supplies\n\nPowder, primers, brass, bullets, and reloading tools.",
    "survival.md": "# Prep & Survival\n\nEmergency gear, tools, first aid, and outdoor essentials.",
    "brands.md": "# Shop by Brand\n\nBrowse all brands carried by Modular Gunworks LLC.",
    "sale.md": "# On Sale\n\nView current deals, discounts, and clearance items.",
}

# Ensure /shop exists
os.makedirs("shop", exist_ok=True)

# Create each category page
for filename, content in categories.items():
    path = os.path.join("shop", filename)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Created: {path}")

print("\nCategory pages created successfully.")
