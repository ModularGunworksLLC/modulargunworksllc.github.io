/**
 * Admin Backend Server
 * Handles CSV imports, image uploads, product management
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const csv = require('csv-parser');
const { createReadStream } = require('fs');
const session = require('express-session');
const AdmZip = require('adm-zip');
const GoogleDriveUploader = require('./google-drive-upload');

const app = express();
const PORT = process.env.ADMIN_PORT || 3001;

// Google Drive uploader instance
let driveUploader = null;

// ============================================
// CONFIGURATION
// ============================================

const UPLOAD_DIR = path.join(__dirname, 'uploads');
const IMAGES_DIR = path.join(__dirname, 'images', 'products');
const DATA_DIR = path.join(__dirname, 'Data');

// Default admin credentials (change these!)
const ADMIN_USERNAME = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASS || 'modulargunworks2024'; // CHANGE THIS!

// ============================================
// MIDDLEWARE SETUP
// ============================================
// Serve static files (for admin.html and any other static assets)
app.use(express.static(path.join(__dirname)));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// File upload configuration
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(UPLOAD_DIR, new Date().toISOString().split('T')[0]);
    await fs.mkdir(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['application/vnd.ms-excel', 'text/csv', 'application/json', 
                     'image/jpeg', 'image/png', 'image/webp', 'application/zip'];
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(csv|json|jpg|jpeg|png|webp|zip)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// ============================================
// AUTHENTICATION MIDDLEWARE
// ============================================

const authMiddleware = (req, res, next) => {
  if (!req.session.authenticated) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// ============================================
// ROUTES: AUTHENTICATION
// ============================================

app.post('/api/auth/login', express.json(), async (req, res) => {
  try {
    const { username, password } = req.body;

    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    req.session.authenticated = true;
    req.session.username = username;
    res.json({ success: true, message: 'Logged in successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/auth/status', (req, res) => {
  res.json({ authenticated: !!req.session.authenticated });
});

// ============================================
// ROUTES: PRODUCT MANAGEMENT
// ============================================

// Get all products
app.get('/api/products', authMiddleware, async (req, res) => {
  try {
    const category = req.query.category;
    let dataFile = 'ammunition-data.json'; // default

    if (category) {
      dataFile = `${category}-data.json`;
    }

    const filePath = path.join(DATA_DIR, dataFile);
    const data = JSON.parse(await fsPromises.readFile(filePath, 'utf-8'));
    
    const products = data.products || data[Object.keys(data)[0]] || [];
    res.json({
      category: category || 'all',
      total: products.length,
      products: products.slice(0, 100) // Return first 100
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search products
app.get('/api/products/search', authMiddleware, async (req, res) => {
  try {
    const query = req.query.q.toLowerCase();
    const results = [];

    // Search across all category files
    const categories = ['ammunition', 'guns', 'optics', 'magazines', 'gun-parts', 'gear', 'reloading', 'survival', 'other'];

    for (const cat of categories) {
      try {
        const filePath = path.join(DATA_DIR, `${cat}-data.json`);
        const data = JSON.parse(await fsPromises.readFile(filePath, 'utf-8'));
        const products = data.products || [];

        products.forEach(p => {
          if ((p.name && p.name.toLowerCase().includes(query)) ||
              (p.sku && p.sku.toLowerCase().includes(query)) ||
              (p.brand && p.brand.toLowerCase().includes(query))) {
            results.push({ ...p, category: cat });
          }
        });
      } catch (e) {
        // Skip if file doesn't exist
      }
    }

    res.json({ results: results.slice(0, 50) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update product
app.put('/api/products/:sku', authMiddleware, async (req, res) => {
  try {
    const { sku } = req.params;
    const updates = req.body;
    const category = updates.category || 'ammunition';

    const filePath = path.join(DATA_DIR, `${category}-data.json`);
    const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));
    
    const productIndex = data.products.findIndex(p => p.sku === sku);
    if (productIndex === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }

    data.products[productIndex] = { ...data.products[productIndex], ...updates };
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));

    res.json({ success: true, product: data.products[productIndex] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// ROUTES: CSV IMPORT
// ============================================

app.post('/api/import/csv', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const results = [];
    const errors = [];

    return new Promise((resolve) => {
      createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (row) => {
          try {
            // Parse the CSV row into product object
            const product = {
              sku: row['CSSI Item Number'] || row['SKU'] || `SKU${Date.now()}`,
              name: row['Web Item Name'] || row['Item Description'] || 'Unknown',
              description: row['Web Item Description'] || '',
              brand: row['Manufacturer'] || '',
              category: row['Category'] || 'other',
              msrp: parseFloat(row['MSRP'] || row['Price'] || 0),
              map: parseFloat(row['Retail MAP'] || 0),
              quantity: parseInt(row['Qty On Hand'] || 0),
              inStock: parseInt(row['Qty On Hand'] || 0) > 0,
              upc: row['UPC Code'] || '',
              weight: parseFloat(row['Item Weight'] || 0),
              image: null,
              images: { thumbnails: [], fullsize: [] }
            };

            results.push(product);
          } catch (e) {
            errors.push({ row, error: e.message });
          }
        })
        .on('end', () => {
          resolve({ results, errors, filename: req.file.originalname });
        })
        .on('error', (err) => {
          resolve({ results: [], errors: [{ error: err.message }] });
        });
    }).then(async ({ results, errors, filename }) => {
      res.json({
        success: true,
        preview: results.slice(0, 10),
        totalRows: results.length,
        errors: errors.length,
        message: `Loaded ${results.length} products from ${filename}`,
        fileId: req.file.filename,
        tempFile: req.file.path
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Confirm CSV import
app.post('/api/import/confirm', authMiddleware, async (req, res) => {
  try {
    const { tempFile, category, mode, selectedIndices } = req.body;

    // Re-parse the CSV file
    const results = [];
    let rowIndex = 0;
    
    return new Promise((resolve) => {
      createReadStream(tempFile)
        .pipe(csv())
        .on('data', (row) => {
          // Only include if in selectedIndices, or if selectedIndices not provided (import all)
          if (!selectedIndices || selectedIndices.includes(rowIndex)) {
            const product = {
              sku: row['CSSI Item Number'] || row['SKU'] || `SKU${Date.now()}-${rowIndex}`,
              name: row['Web Item Name'] || row['Item Description'],
              description: row['Web Item Description'] || '',
              brand: row['Manufacturer'] || '',
              category: row['Category'] || category || 'other',
              msrp: parseFloat(row['MSRP'] || row['Price'] || 0),
              map: parseFloat(row['Retail MAP'] || 0),
              quantity: parseInt(row['Qty On Hand'] || 0),
              inStock: parseInt(row['Qty On Hand'] || 0) > 0,
              upc: row['UPC Code'] || '',
              weight: parseFloat(row['Item Weight'] || 0),
              image: null,
              images: { thumbnails: [], fullsize: [] }
            };
            results.push(product);
          }
          rowIndex++;
        })
        .on('end', async () => {
          // Group by category
          const byCategory = {};
          results.forEach(p => {
            const cat = p.category || 'other';
            if (!byCategory[cat]) byCategory[cat] = [];
            byCategory[cat].push(p);
          });

          // Update files
          for (const [cat, products] of Object.entries(byCategory)) {
            const filePath = path.join(DATA_DIR, `${cat}-data.json`);
            
            let existingData = { category: cat, products: [], totalProducts: 0, lastUpdated: new Date().toISOString() };
            try {
              existingData = JSON.parse(await fsPromises.readFile(filePath, 'utf-8'));
            } catch (e) {
              // File doesn't exist, use defaults
            }

            if (mode === 'merge') {
              // Add new products, update existing by SKU
              products.forEach(newProduct => {
                const idx = existingData.products.findIndex(p => p.sku === newProduct.sku);
                if (idx >= 0) {
                  existingData.products[idx] = newProduct;
                } else {
                  existingData.products.push(newProduct);
                }
              });
            } else {
              // Replace mode - use new products
              existingData.products = products;
            }

            existingData.totalProducts = existingData.products.length;
            existingData.lastUpdated = new Date().toISOString();

            await fs.writeFile(filePath, JSON.stringify(existingData, null, 2));
          }

          // Clean up temp file
          await fs.unlink(tempFile).catch(() => {});

          resolve();
        });
    }).then(() => {
      res.json({ 
        success: true, 
        message: `Imported ${results.length} products. Changes live on the site.`
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// ROUTES: IMAGE MATCHING
// ============================================

/**
 * Parse filename to extract product identifiers
 * Supports: SKU-123456.jpg, 123456.jpg, SKU123456.jpg, product-name.jpg
 */
function parseFilename(filename) {
  // Remove extension
  const name = filename.replace(/\.[^/.]+$/, '');
  
  // Try to extract SKU (6+ digits or SKU prefix)
  const skuMatch = name.match(/(?:SKU)?(\d{6,})/i);
  const sku = skuMatch ? skuMatch[1] : null;
  
  // Extract product name (everything except leading SKU)
  let productName = name.replace(/^SKU?\d+[-_]?/i, '').replace(/[-_]/g, ' ').trim();
  
  // Clean up product name - remove extra spaces
  productName = productName.replace(/\s+/g, ' ');
  
  // Tokenize for better matching
  const tokens = productName.toLowerCase().split(/\s+/).filter(t => t.length > 0);
  
  return {
    sku,
    productName: productName || null,
    tokens, // for token-based matching
    originalFilename: filename
  };
}

// Helper: Calculate match score based on token overlap
function calculateNameMatchScore(productName, searchTokens) {
  if (!productName || searchTokens.length === 0) return 0;
  
  const dbTokens = productName.toLowerCase().split(/[\s\-./,()]+/).filter(t => t.length > 0);
  
  // Count how many search tokens are in the database name
  const matchedTokens = searchTokens.filter(token => 
    dbTokens.some(dbToken => 
      dbToken === token || 
      dbToken.includes(token) || 
      token.includes(dbToken)
    )
  );
  
  // Score based on ratio of matched tokens
  const matchRatio = matchedTokens.length / searchTokens.length;
  
  // Bonus if the first few tokens match (usually brand/model)
  let bonus = 0;
  if (dbTokens[0] && searchTokens[0] && dbTokens[0] === searchTokens[0]) bonus += 5;
  
  return Math.min(100, Math.round(matchRatio * 95 + bonus));
}

// Match image filename to products
app.post('/api/images/match', authMiddleware, async (req, res) => {
  try {
    const { filename } = req.body;
    if (!filename) {
      return res.status(400).json({ error: 'No filename provided' });
    }

    const parsed = parseFilename(filename);
    const matches = [];

    const categories = ['ammunition', 'guns', 'optics', 'magazines', 'gun-parts', 'gear', 'reloading', 'survival', 'other'];

    // Search for products matching SKU or name
    for (const cat of categories) {
      try {
        const filePath = path.join(DATA_DIR, `${cat}-data.json`);
        
        // Check if file exists
        if (!fs.existsSync(filePath)) {
          console.log(`File not found: ${filePath}`);
          continue;
        }

        const data = JSON.parse(await fsPromises.readFile(filePath, 'utf-8'));
        const products = data.products || [];

        products.forEach(p => {
          let matchScore = 0;
          let matchReason = '';
          
          // Exact SKU match (highest priority)
          if (parsed.sku && p.sku && p.sku.toUpperCase() === parsed.sku.toUpperCase()) {
            matchScore = 100;
            matchReason = 'Exact SKU match';
          }
          // SKU contains search (high priority)
          else if (parsed.sku && p.sku && p.sku.toUpperCase().includes(parsed.sku.toUpperCase())) {
            matchScore = 80;
            matchReason = 'SKU contains match';
          }
          // Token-based name matching
          else if (parsed.tokens && parsed.tokens.length > 0 && p.name) {
            const tokenScore = calculateNameMatchScore(p.name, parsed.tokens);
            
            // Only include if there's meaningful overlap (>40% token match)
            if (tokenScore >= 40) {
              matchScore = tokenScore;
              matchReason = 'Name match: ' + Math.round(tokenScore) + '%';
            }
          }
          
          if (matchScore > 0) {
            matches.push({
              sku: p.sku,
              name: p.name,
              manufacturer: p.manufacturer || '',
              brand: p.brand || '',
              price: p.price,
              category: cat,
              matchScore,
              matchReason
            });
          }
        });
      } catch (e) {
        console.error(`Error reading category ${cat}:`, e.message);
        // Skip category
      }
    }

    // Sort by match score descending, then by name
    matches.sort((a, b) => {
      if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore;
      }
      return (a.name || '').localeCompare(b.name || '');
    });

    console.log(`Match for "${filename}": found ${matches.length} products (parsed tokens: ${parsed.tokens.join(', ')})`);

    res.json({
      parsed,
      matches: matches.slice(0, 10), // Top 10 matches
      matchCount: matches.length,
      hasMatches: matches.length > 0
    });
  } catch (error) {
    console.error('Match error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// ROUTES: IMAGE UPLOAD (Google Drive)
// ============================================

app.post('/api/images/upload', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    if (!driveUploader) {
      return res.status(503).json({ error: 'Google Drive service not available' });
    }

    const { category, sku } = req.body;
    const filename = `${sku || Date.now()}.jpg`;

    try {
      // Upload to Google Drive
      const driveUrl = await driveUploader.uploadImage(
        req.file.buffer,
        filename,
        category || 'other'
      );

      res.json({
        success: true,
        imageUrl: driveUrl,
        storage: 'google-drive',
        message: 'Image uploaded to Google Drive successfully'
      });
    } finally {
      // Clean up temp file
      await fs.unlink(req.file.path).catch(() => {});
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk image upload (zip) to Google Drive
app.post('/api/images/bulk-upload', authMiddleware, upload.single('zip'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!driveUploader) {
      return res.status(503).json({ error: 'Google Drive service not available' });
    }

    const { category } = req.body;
    const zip = new AdmZip(req.file.buffer);
    const entries = zip.getEntries();
    const results = [];
    const uploadTasks = [];

    // Extract and upload images
    for (const entry of entries) {
      if (entry.isDirectory) continue;

      const filename = entry.name.split('/').pop();
      if (!filename.match(/\.(jpg|jpeg|png|gif)$/i)) continue;

      const imageBuffer = entry.getData();
      uploadTasks.push(
        driveUploader.uploadImage(imageBuffer, filename, category || 'other')
          .then(url => {
            results.push({
              filename,
              success: true,
              url: url
            });
          })
          .catch(error => {
            results.push({
              filename,
              success: false,
              error: error.message
            });
          })
      );
    }

    // Wait for all uploads
    await Promise.all(uploadTasks);

    // Clean up temp file
    await fs.unlink(req.file.path).catch(() => {});

    res.json({
      success: true,
      uploadedCount: results.filter(r => r.success).length,
      failedCount: results.filter(r => !r.success).length,
      storage: 'google-drive',
      results
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// ROUTES: DASHBOARD DATA
// ============================================

app.get('/api/dashboard/stats', authMiddleware, async (req, res) => {
  try {
    const categories = ['ammunition', 'guns', 'optics', 'magazines', 'gun-parts', 'gear', 'reloading', 'survival', 'other'];
    const stats = {};
    let totalProducts = 0;

    for (const cat of categories) {
      try {
        const filePath = path.join(DATA_DIR, `${cat}-data.json`);
        const data = JSON.parse(await fsPromises.readFile(filePath, 'utf-8'));
        const count = (data.products || []).length;
        stats[cat] = count;
        totalProducts += count;
      } catch (e) {
        stats[cat] = 0;
      }
    }

    res.json({ totalProducts, categories: stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// ERROR HANDLING
// ============================================

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Server error' });
});

// ============================================
// START SERVER WITH GOOGLE DRIVE INIT
// ============================================

const server = app.listen(PORT, async () => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Admin Backend Server running at http://localhost:${PORT}`);
  console.log(`Default credentials: admin / modulargunworks2024`);
  console.log(`⚠️  CHANGE THE DEFAULT PASSWORD IMMEDIATELY`);
  console.log(`${'='.repeat(60)}\n`);

  // Initialize Google Drive
  console.log('Initializing Google Drive...');
  driveUploader = new GoogleDriveUploader();
  
  const initialized = await driveUploader.initialize();
  if (initialized) {
    // Get parent folder ID from environment or prompt user
    const parentFolderId = process.env.GOOGLE_DRIVE_PARENT_FOLDER || 'root';
    console.log(`Setting up product folders in Google Drive (parent: ${parentFolderId})...`);
    
    await driveUploader.setupFolders(parentFolderId);
    console.log('✓ Google Drive is ready for image uploads\n');
  } else {
    console.error('✗ Failed to initialize Google Drive. Image uploads will fail.\n');
  }
});

module.exports = app;
