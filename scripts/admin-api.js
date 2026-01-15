const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const crypto = require('crypto');

// Configuration
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'gunworks2024'; // Change this!
const ADMIN_PORT = process.env.ADMIN_PORT || 3001;
const ACTIVE_FILE = path.join(__dirname, '../data/products/active.json');

// Initialize Express
const app = express();
app.use(express.json());
app.use(cors());

// Middleware: Auth token verification
function verifyAuth(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token || !validateToken(token)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
}

// Token management
const activeTokens = new Set();

function generateToken(password) {
    return crypto.createHash('sha256').update(password + Date.now()).digest('hex');
}

function validateToken(token) {
    return activeTokens.has(token);
}

// Load active products
function loadActive() {
    try {
        if (fs.existsSync(ACTIVE_FILE)) {
            const data = fs.readFileSync(ACTIVE_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading active products:', error);
    }
    return {};
}

// Save active products
function saveActive(data) {
    try {
        const dir = path.dirname(ACTIVE_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(ACTIVE_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving active products:', error);
        return false;
    }
}

// Load all products from data files
function loadAllProducts() {
    const products = [];
    const productsDir = path.join(__dirname, '../data/products');
    const categories = ['ammunition', 'magazines', 'reloading', 'gun-parts', 'optics', 'gear', 'survival'];

    categories.forEach(category => {
        try {
            const file = path.join(productsDir, `${category}.json`);
            if (fs.existsSync(file)) {
                const data = JSON.parse(fs.readFileSync(file, 'utf8'));
                if (data.products && Array.isArray(data.products)) {
                    data.products.forEach(product => {
                        products.push({
                            ...product,
                            category: category
                        });
                    });
                }
            }
        } catch (error) {
            console.error(`Error loading ${category}.json:`, error);
        }
    });

    return products;
}

// Routes

/**
 * POST /api/admin/auth
 * Authenticate with password
 */
app.post('/api/admin/auth', (req, res) => {
    const { password } = req.body;

    if (password === ADMIN_PASSWORD) {
        const token = generateToken(password);
        activeTokens.add(token);
        
        // Token expires in 8 hours
        setTimeout(() => activeTokens.delete(token), 8 * 60 * 60 * 1000);
        
        res.json({ success: true, token });
    } else {
        res.status(401).json({ error: 'Invalid password' });
    }
});

/**
 * GET /api/admin/search
 * Search and filter products
 * Query params: q, brand, category, stock, limit, offset
 */
app.get('/api/admin/search', verifyAuth, (req, res) => {
    try {
        const { q = '', brand = '', category = '', stock = '', limit = 100, offset = 0 } = req.query;
        
        let products = loadAllProducts();

        // Filter
        products = products.filter(p => {
            const matchSearch = !q || p.name.toLowerCase().includes(q.toLowerCase());
            const matchBrand = !brand || p.brand === brand;
            const matchCategory = !category || p.category === category;
            const matchStock = !stock || (stock === 'in-stock' ? p.inStock : !p.inStock);
            return matchSearch && matchBrand && matchCategory && matchStock;
        });

        const total = products.length;
        products = products.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

        res.json({
            products,
            total,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/admin/active
 * Get all active products
 */
app.get('/api/admin/active', verifyAuth, (req, res) => {
    try {
        const active = loadActive();
        res.json(active);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/admin/active/:page
 * Get active products for a specific page
 */
app.get('/api/admin/active/:page', verifyAuth, (req, res) => {
    try {
        const { page } = req.params;
        const active = loadActive();
        
        const pageProducts = Object.entries(active)
            .filter(([_, data]) => data.page === page)
            .reduce((acc, [id, data]) => {
                acc[id] = data;
                return acc;
            }, {});

        res.json(pageProducts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/admin/activate
 * Add product to active list
 * Body: { productId, page }
 */
app.post('/api/admin/activate', verifyAuth, (req, res) => {
    try {
        const { productId, page } = req.body;

        if (!productId || !page) {
            return res.status(400).json({ error: 'Missing productId or page' });
        }

        const active = loadActive();
        active[productId] = {
            page,
            addedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        if (saveActive(active)) {
            res.json({ success: true, message: 'Product activated' });
        } else {
            res.status(500).json({ error: 'Failed to save' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/admin/deactivate
 * Remove product from active list
 * Body: { productId }
 */
app.post('/api/admin/deactivate', verifyAuth, (req, res) => {
    try {
        const { productId } = req.body;

        if (!productId) {
            return res.status(400).json({ error: 'Missing productId' });
        }

        const active = loadActive();
        delete active[productId];

        if (saveActive(active)) {
            res.json({ success: true, message: 'Product deactivated' });
        } else {
            res.status(500).json({ error: 'Failed to save' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/admin/batch-activate
 * Activate multiple products at once
 * Body: { productIds: [], page }
 */
app.post('/api/admin/batch-activate', verifyAuth, (req, res) => {
    try {
        const { productIds, page } = req.body;

        if (!Array.isArray(productIds) || !page) {
            return res.status(400).json({ error: 'Invalid input' });
        }

        const active = loadActive();
        const timestamp = new Date().toISOString();

        productIds.forEach(id => {
            active[id] = {
                page,
                addedAt: timestamp,
                updatedAt: timestamp
            };
        });

        if (saveActive(active)) {
            res.json({ success: true, count: productIds.length });
        } else {
            res.status(500).json({ error: 'Failed to save' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/admin/stats
 * Get system statistics
 */
app.get('/api/admin/stats', verifyAuth, (req, res) => {
    try {
        const products = loadAllProducts();
        const active = loadActive();

        const stats = {
            totalProducts: products.length,
            activeProducts: Object.keys(active).length,
            byCategory: {},
            byPage: {}
        };

        products.forEach(p => {
            if (!stats.byCategory[p.category]) {
                stats.byCategory[p.category] = 0;
            }
            stats.byCategory[p.category]++;
        });

        Object.values(active).forEach(data => {
            if (!stats.byPage[data.page]) {
                stats.byPage[data.page] = 0;
            }
            stats.byPage[data.page]++;
        });

        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Health check
app.get('/api/admin/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Start server
const server = app.listen(ADMIN_PORT, () => {
    console.log(`✓ Admin API running on http://localhost:${ADMIN_PORT}`);
    console.log(`✓ Open admin panel: http://localhost:${ADMIN_PORT}/../admin.html`);
    console.log(`⚠️  Change ADMIN_PASSWORD for production!`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down admin API...');
    server.close(() => {
        console.log('Admin API stopped');
        process.exit(0);
    });
});

module.exports = app;
