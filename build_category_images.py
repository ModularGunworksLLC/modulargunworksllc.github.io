import os
import requests
from PIL import Image
from io import BytesIO

# -----------------------------------------
# Category list (edit anytime)
# -----------------------------------------
CATEGORIES = {
    "guns": "firearm",
    "ammunition": "ammo",
    "optics": "rifle scope",
    "gear": "tactical gear",
    "magazines": "rifle magazine",
    "reloading": "reloading bench",
    "survival": "survival gear",
    "sale": "discount tag"
}

# -----------------------------------------
# Output folder
# -----------------------------------------
OUTPUT_DIR = "images/categories"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# -----------------------------------------
# Image size (homepage tile friendly)
# -----------------------------------------
TARGET_SIZE = (1200, 600)

# -----------------------------------------
# Placeholder image source (royalty-free)
# Using Unsplash's free source API
# -----------------------------------------
UNSPLASH_URL = "https://source.unsplash.com/1600x900/?{}"

def download_and_resize(keyword, filename):
    print(f"Downloading image for: {keyword}")

    # Download from Unsplash
    response = requests.get(UNSPLASH_URL.format(keyword), timeout=10)

    if response.status_code != 200:
        print(f"Failed to download image for {keyword}")
        return

    # Open image
    img = Image.open(BytesIO(response.content))

    # Resize and crop
    img = img.resize(TARGET_SIZE, Image.LANCZOS)

    # Save
    filepath = os.path.join(OUTPUT_DIR, filename)
    img.save(filepath, "JPEG", quality=90)

    print(f"Saved: {filepath}")

def main():
    print("Building category images...\n")

    for category, keyword in CATEGORIES.items():
        filename = f"{category}.jpg"
        download_and_resize(keyword, filename)

    print("\nDone! Category images are ready.")

if __name__ == "__main__":
    main()
