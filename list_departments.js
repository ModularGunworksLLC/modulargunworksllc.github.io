const fs = require('fs');
const crypto = require('crypto');

// Chattanooga API credentials (set these as environment variables)
const API_SID = process.env.API_SID;
const API_TOKEN = process.env.API_TOKEN;
const API_BASE = 'https://api.chattanoogashooting.com/rest/v4';

/**
 * Get authentication header for API
 */
function getAuthHeader(token) {
    const tokenHash = crypto.createHash('md5').update(token).digest('hex');
    return `Basic ${API_SID}:${tokenHash}`;
}

/**
 * Fetch products from Chattanooga API
 */
async function fetchAllProducts(page = 1) {
    try {
        const url = `${API_BASE}/items?page=${page}&per_page=50`;
        const authHeader = getAuthHeader(API_TOKEN);

        const response = await fetch(url, {
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Error fetching page ${page}:`, error.message);
        return { items: [], pagination: {} };
    }
}

/**
 * Collect all unique departments from API
 */
async function collectDepartments() {
    console.log('Fetching departments from Chattanooga API...\n');

    if (!API_SID || !API_TOKEN) {
        console.error('❌ Error: Set API_SID and API_TOKEN environment variables');
        process.exit(1);
    }

    const departments = new Set();
    let page = 1;
    let hasMore = true;

    while (hasMore) {
        console.log(`Fetching page ${page}...`);
        const data = await fetchAllProducts(page);

        if (data.items && data.items.length > 0) {
            for (const item of data.items) {
                if (item.department) {
                    departments.add(item.department);
                }
            }
        }

        // Check if there are more pages
        if (data.pagination && data.pagination.total_pages) {
            hasMore = page < data.pagination.total_pages;
        } else {
            hasMore = data.items && data.items.length === 50; // Assuming 50 per page
        }

        page++;

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
    }

    console.log(`\nFound ${departments.size} unique departments:\n`);
    const sorted = Array.from(departments).sort();
    sorted.forEach(dept => console.log(`- "${dept}"`));

    console.log(`\nTotal unique departments: ${departments.size}`);
}

collectDepartments();