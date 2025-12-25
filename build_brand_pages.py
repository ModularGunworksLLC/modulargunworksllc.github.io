import os

# Simple starter brand list (you can expand this anytime)
brands = [
    "Glock",
    "Sig Sauer",
    "Smith & Wesson",
    "Ruger",
    "Springfield Armory",
    "FN America",
    "HK",
    "Aero Precision",
    "Magpul",
    "Holosun",
]

# Create /brands folder
os.makedirs("brands", exist_ok=True)

# Create A–Z folders
letters = "abcdefghijklmnopqrstuvwxyz"
for letter in letters:
    os.makedirs(os.path.join("brands", letter), exist_ok=True)

# Create index.md
index_path = os.path.join("brands", "index.md")
with open(index_path, "w", encoding="utf-8") as f:
    f.write("# Shop by Brand\n\nBrowse all brands carried by Modular Gunworks LLC.\n")
print(f"Created: {index_path}")

# Create brand pages
for brand in brands:
    slug = brand.lower().replace(" ", "-").replace("&", "and")
    first_letter = slug[0]

    filepath = os.path.join("brands", first_letter, f"{slug}.md")
    content = f"# {brand}\n\nShop {brand} products at Modular Gunworks LLC.\n"

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"Created: {filepath}")

print("\nBrand pages created successfully.")
