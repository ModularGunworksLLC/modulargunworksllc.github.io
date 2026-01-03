import os

# Define the base structure
folders = [
    "images",
    "shop",
]

files = {
    "index.html": "",
    "style.css": "",
    "about.html": "",
    "contact.html": "",
    "shop/ammunition.md": "",
    "shop/guns.html": "",
    "shop/magazines.md": "",
    "shop/gun-parts.md": "",
    "shop/gear.md": "",
    "shop/optics.md": "",
    "shop/reloading.md": "",
    "shop/survival.md": "",
    "shop/brands.md": "",
    "shop/sale.md": "",
}

# Create folders
for folder in folders:
    os.makedirs(folder, exist_ok=True)
    print(f"Created folder: {folder}")

# Create files
for filepath, content in files.items():
    folder = os.path.dirname(filepath)
    if folder and not os.path.exists(folder):
        os.makedirs(folder, exist_ok=True)

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Created file: {filepath}")

print("\nStarter project structure created successfully.")
