import os
from PIL import Image, ImageDraw, ImageFont

# Categories (matching your shop/*.md files)
categories = [
    "Ammunition",
    "Guns",
    "Magazines",
    "Gun Parts",
    "Gear",
    "Optics",
    "Reloading",
    "Survival",
    "Brands",
    "Sale",
]

# Brands (same list from Option A)
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

# Create folders
os.makedirs("images/categories", exist_ok=True)
os.makedirs("images/brands", exist_ok=True)

# Create a simple placeholder image
def create_placeholder(text, path):
    img = Image.new("RGB", (600, 400), color=(40, 40, 40))
    draw = ImageDraw.Draw(img)

    try:
        font = ImageFont.truetype("arial.ttf", 40)
    except:
        font = ImageFont.load_default()

    # NEW: Use textbbox instead of textsize
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]

    position = ((600 - text_width) // 2, (400 - text_height) // 2)

    draw.text(position, text, fill=(200, 200, 200), font=font)
    img.save(path)
    print(f"Created: {path}")

# Generate category images
for cat in categories:
    slug = cat.lower().replace(" ", "-")
    path = f"images/categories/{slug}.png"
    create_placeholder(cat, path)

# Generate brand images
for brand in brands:
    slug = brand.lower().replace(" ", "-").replace("&", "and")
    path = f"images/brands/{slug}.png"
    create_placeholder(brand, path)

print("\nPlaceholder images created successfully.")
