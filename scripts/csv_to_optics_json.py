
import csv
import json
import os
from collections import defaultdict

# Path to your CSV file
csv_path = r'c:/Users/micha/Downloads/2025 Auth Order Form Plus (1).xls - NcSTAR 2025 AUTH ORDER FORM.csv'
# Output JSON file
json_path = r'c:/Users/micha/modular-gunworks-site/modulargunworksllc.github.io/Data/optics-data.json'

brand_field = 'NcSTAR'  # All products in this sheet are NcSTAR, but can be extended

def parse_price(val):
    try:
        return float(val.replace('$','').replace(',','').strip())
    except Exception:
        return None

def find_images_for_sku(sku):
    # Return all matching images for SKU (fuzzy, ignore case, allow extra suffixes)
    base_path = os.path.join('images', 'PERFORMANCE GEAR')
    thumb_base = os.path.join('images', 'thumbnails')
    if not os.path.exists(base_path):
        return {'thumbnails': [], 'fullsize': []}
    sku_lower = sku.lower()
    fullsize = []
    thumbnails = []
    for fname in os.listdir(base_path):
        fname_lower = fname.lower()
        if sku_lower in fname_lower and fname_lower.endswith((".jpg", ".jpeg", ".png")):
            # WebP fullsize path
            webp_name = os.path.splitext(fname)[0] + '.webp'
            webp_path = os.path.join('PERFORMANCE GEAR', webp_name)
            if os.path.exists(os.path.join(base_path, webp_name)):
                fullsize.append(webp_path.replace('\\', '/'))
            # Thumbnail path
            thumb_path = os.path.join(thumb_base, webp_name)
            if os.path.exists(thumb_path):
                thumbnails.append(os.path.join('thumbnails', webp_name).replace('\\', '/'))
    return {'thumbnails': thumbnails, 'fullsize': fullsize}

def main():
    optics = defaultdict(list)
    missing_images = []
    with open(csv_path, newline='', encoding='utf-8') as csvfile:
        # Find the header row dynamically
        while True:
            pos = csvfile.tell()
            line = csvfile.readline()
            if 'CATEGORY / SKU' in line and 'ITEM DESCRIPTION' in line:
                break
        # Now process the rest of the file as raw CSV rows
        csvfile.seek(pos)
        reader = csv.reader(csvfile)
        headers = next(reader)
        current_category = None
        for row in reader:
            # Skip empty or short rows
            if len(row) < 15:
                continue
            # If this row is a category header (e.g., 'COMBOS', 'DOT SIGHTS', etc.), update current_category
            if row[2].strip() and not row[3].strip() and not row[4].strip():
                current_category = row[2].strip()
                continue
            # Map columns by index (skip blank columns)
            # 0: blank, 1: CAT PG#, 2: SKU, 3: CASE QTY, 4: NAME, 7: UPC, 8: START DATE, 9: AUTH PRICE, 10: AUTH PLUS, 13: MAP, 14: MSRP
            sku = row[2].strip()
            name = row[4].strip()
            upc = row[7].strip()
            msrp = parse_price(row[14])
            map_price = parse_price(row[13])
            price = parse_price(row[10])
            case_qty = row[3].strip()
            auth_plus = parse_price(row[10])
            if not sku or not name:
                continue
            images = find_images_for_sku(sku)
            product = {
                'sku': sku,
                'category': current_category if current_category else 'Optics',
                'name': name,
                'upc': upc,
                'msrp': msrp,
                'map': map_price,
                'price': price,
                'case_qty': case_qty,
                'auth_plus': auth_plus,
                'description': name,
                'brand': brand_field
            }
            if images['fullsize'] or images['thumbnails']:
                product['images'] = images
            else:
                missing_images.append(sku)
            optics[brand_field].append(product)
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(optics, f, indent=2)
    print(f"Exported {sum(len(v) for v in optics.values())} products to {json_path}")
    if missing_images:
        print(f"SKUs with no matching images ({len(missing_images)}):")
        for sku in missing_images:
            print(f"  {sku}")

if __name__ == '__main__':
    main()
