const fs = require('fs');
const crypto = require('crypto');

// Chattanooga API credentials
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
 * Fetch first page and inspect item structure
 */
async function inspectItem() {
    console.log('Inspecting first item from Chattanooga API...\n');

    if (!API_SID || !API_TOKEN) {
        console.error('❌ Error: Set API_SID and API_TOKEN environment variables');
        process.exit(1);
    }

    const url = `${API_BASE}/items?page=1&per_page=1`;
    const authHeader = getAuthHeader(API_TOKEN);

    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        if (data.items && data.items.length > 0) {
            const item = data.items[0];
            console.log('Keys in item object:');
            Object.keys(item).forEach(key => {
                console.log(`- ${key}: ${typeof item[key]} (${item[key] ? 'has value' : 'null/empty'})`);
            });

            console.log('\nFull item (first 500 chars):');
            console.log(JSON.stringify(item, null, 2).substring(0, 500) + '...');
        } else {
            console.log('No items found');
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

inspectItem();