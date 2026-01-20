const fs = require('fs');
const path = require('path');

// Load category mapping
const categoryMapping = JSON.parse(fs.readFileSync('category_mapping.json', 'utf8')).chattanoogaToSiteMapping;

// CSV file path
const csvPath = path.join(__dirname, 'data', 'Chattanooga - itemInventory (4).csv');

// Output directory
const outputDir = path.join(__dirname, 'data', 'products');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Site categories
const SITE_CATEGORIES = [
  'ammunition',
  'gear',
  'gun-parts',
  'magazines',
  'optics',
  'outdoors',
  'reloading',
  'sale'
];

// Initialize product collections
const productsByCategory = {};
SITE_CATEGORIES.forEach(cat => {
  productsByCategory[cat] = [];
});

let processedCount = 0;
let skippedCount = 0;
let errorCount = 0;

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

function transformProduct(csvRow, headers) {
  try {
    const row = {};
    headers.forEach((header, index) => {
      row[header] = csvRow[index] || '';
    });

    // Skip if no category
    if (!row['Category']) {
      skippedCount++;
      return null;
    }

    // Map category
    const siteCategory = categoryMapping[row['Category']];
    if (!siteCategory) {
      console.log(`Unknown category: ${row['Category']}`);
      skippedCount++;
      return null;
    }

    // Skip firearms (rifles, handguns, shotguns) as they require FFL
    const categoryLower = row['Category'].toLowerCase();
    if (categoryLower.includes('rifles') || categoryLower.includes('handguns') ||
        categoryLower.includes('shotguns') || categoryLower.includes('firearms') ||
        categoryLower.includes('used guns') || categoryLower.includes('short barreled rifles')) {
      skippedCount++;
      return null;
    }

    // Get product name
    const productName = row['Web Item Name'] || row['Item Description'] || '';
    if (!productName.trim()) {
      skippedCount++;
      return null;
    }

    // Parse inventory
    const inventory = parseInt(row['Qty On Hand']) || 0;

    // Parse prices
    const retailPrice = parseFloat(row['Price']) || 0;
    const msrp = parseFloat(row['MSRP']) || 0;
    const mapPrice = parseFloat(row['Retail MAP']) || 0;

    // Use retail price as sale price, MSRP as retail price if available
    const finalRetailPrice = msrp > 0 ? msrp : retailPrice;
    const finalSalePrice = retailPrice;

    // Determine if requires FFL (ammunition and magazines might)
    let requiresFFL = false;
    if (siteCategory === 'ammunition') {
      requiresFFL = false; // Most ammo doesn't require FFL for transfer
    } else if (siteCategory === 'magazines') {
      // High capacity magazines might require FFL in some states
      requiresFFL = false; // Default to false, can be updated based on specific rules
    }

    // Extract brand from manufacturer
    const brand = row['Manufacturer'] || 'Generic';

    // Create product object
    const product = {
      id: row['CSSI Item Number'] || row['Manufacturer Item Number'] || `CHATT_${processedCount}`,
      name: productName,
      brand: brand,
      category: siteCategory,
      image: `https://images.chattanoogashooting.com/products/${row['Manufacturer Item Number'] || 'default'}.jpg`,
      retailPrice: finalRetailPrice,
      salePrice: finalSalePrice,
      inventory: inventory,
      inStock: inventory > 0,
      requiresFFL: requiresFFL,
      serialized: false, // Most accessories aren't serialized
      dropShip: true, // Chattanooga likely dropships
      allocated: false,
      mapPrice: mapPrice,
      lastUpdated: new Date().toISOString(),
      // Additional fields based on category
      caliber: null,
      platform: null,
      capacity: null,
      material: null
    };

    // Add category-specific fields
    if (siteCategory === 'ammunition') {
      // Try to extract caliber from name
      const caliberMatch = productName.match(/(\d+\.?\d*\s*(mm|cal|gauge|ga))/i);
      if (caliberMatch) {
        product.caliber = caliberMatch[1].toUpperCase();
      }
    } else if (siteCategory === 'magazines') {
      // Try to extract capacity
      const capacityMatch = productName.match(/(\d+)\s*(rd|round)/i);
      if (capacityMatch) {
        product.capacity = parseInt(capacityMatch[1]);
      }
    }

    return { product, siteCategory };

  } catch (error) {
    console.error('Error transforming product:', error);
    errorCount++;
    return null;
  }
}

function processCSV() {
  console.log('Processing Chattanooga CSV...\n');

  if (!fs.existsSync(csvPath)) {
    console.error('CSV file not found:', csvPath);
    return;
  }

  const fileStream = fs.createReadStream(csvPath, { encoding: 'utf8' });
  let headers = [];
  let lineCount = 0;
  let buffer = '';

  fileStream.on('data', (chunk) => {
    buffer += chunk;
    const lines = buffer.split('\n');
    buffer = lines.pop(); // Keep incomplete line

    for (const line of lines) {
      lineCount++;
      const columns = parseCSVLine(line);

      if (lineCount === 1) {
        headers = columns;
        console.log('Headers loaded:', headers.length);
        continue;
      }

      if (columns.length >= headers.length) {
        const result = transformProduct(columns, headers);
        if (result) {
          const { product, siteCategory } = result;
          productsByCategory[siteCategory].push(product);
          processedCount++;

          if (processedCount % 1000 === 0) {
            console.log(`Processed ${processedCount} products...`);
          }
        }
      }
    }
  });

  fileStream.on('end', () => {
    console.log(`\nProcessing complete!`);
    console.log(`Total lines processed: ${lineCount}`);
    console.log(`Products processed: ${processedCount}`);
    console.log(`Products skipped: ${skippedCount}`);
    console.log(`Errors: ${errorCount}`);

    // Write category files
    SITE_CATEGORIES.forEach(category => {
      const products = productsByCategory[category];
      if (products.length > 0) {
        const outputFile = path.join(outputDir, `${category}.json`);
        const outputData = {
          category: category,
          lastUpdated: new Date().toISOString(),
          products: products
        };

        fs.writeFileSync(outputFile, JSON.stringify(outputData, null, 2));
        console.log(`Wrote ${products.length} products to ${category}.json`);
      }
    });

    // Write summary
    const summary = {
      totalProcessed: processedCount,
      totalSkipped: skippedCount,
      totalErrors: errorCount,
      categories: SITE_CATEGORIES.reduce((acc, cat) => {
        acc[cat] = productsByCategory[cat].length;
        return acc;
      }, {})
    };

    fs.writeFileSync('sync_summary.json', JSON.stringify(summary, null, 2));
    console.log('\nSync summary written to sync_summary.json');
  });

  fileStream.on('error', (err) => {
    console.error('Error reading CSV:', err);
  });
}

processCSV();