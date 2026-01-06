# Batch Image Optimization Script
# Converts all PNG/JPG images to WebP and generates thumbnails (300x200px)
# Place this script in your project root and run with Python 3.x

import os
from PIL import Image

# Source and destination directories
SRC_DIR = 'images/PERFORMANCE GEAR'
THUMB_DIR = 'images/thumbnails'

# Supported image extensions
EXTS = ('.jpg', '.jpeg', '.png')

# Thumbnail size
THUMB_SIZE = (300, 200)

for root, _, files in os.walk(SRC_DIR):
    for fname in files:
        if fname.lower().endswith(EXTS):
            src_path = os.path.join(root, fname)
            rel_path = os.path.relpath(src_path, SRC_DIR)
            base, _ = os.path.splitext(rel_path)
            # Output paths
            webp_path = os.path.join(root, base + '.webp')
            thumb_path = os.path.join(THUMB_DIR, base + '.webp')
            os.makedirs(os.path.dirname(thumb_path), exist_ok=True)
            try:
                with Image.open(src_path) as img:
                    # Convert to WebP
                    img.save(webp_path, 'WEBP', quality=85)
                    # Create and save thumbnail
                    img_thumb = img.copy()
                    img_thumb.thumbnail(THUMB_SIZE)
                    img_thumb.save(thumb_path, 'WEBP', quality=85)
                print(f'Processed: {src_path}')
            except Exception as e:
                print(f'Error processing {src_path}: {e}')

print('Batch image optimization complete.')
