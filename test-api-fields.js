const crypto = require('crypto');

const API_SID = process.env.API_SID || '3E5B1B51AB84E327E32E0CE4478B84AD';
const API_TOKEN = process.env.API_TOKEN || '3E5B1B52C8F5F75446E38A1BBA9706B3';
const API_BASE = 'https://api.chattanoogashooting.com/rest/v4';

function getAuthHeader(token) {
    const tokenHash = crypto.createHash('md5').update(token).digest('hex');
    return `Basic ${API_SID}:${tokenHash}`;
}

async function testAPI() {
    try {
        const url = `${API_BASE}/items?page=1&per_page=3`;
        console.log('🔍 Fetching sample products from:', url);
        
        const response = await fetch(url, {
            headers: {
                'Authorization': getAuthHeader(API_TOKEN),
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.log('❌ Response status:', response.status);
            const text = await response.text();
            console.log('Response body:', text);
            return;
        }

        const data = await response.json();
        
        if (data.items && data.items.length > 0) {
            console.log('\n✓ Found', data.items.length, 'products');
            console.log('\n📊 FIRST PRODUCT - All Available Fields:');
            console.log('='.repeat(60));
            
            const product = data.items[0];
            Object.entries(product).forEach(([key, value]) => {
                console.log(`  ${key.padEnd(25)}: ${JSON.stringify(value).substring(0, 80)}`);
            });

            console.log('\n\n📊 SECOND PRODUCT for comparison:');
            console.log('='.repeat(60));
            const product2 = data.items[1];
            Object.entries(product2).forEach(([key, value]) => {
                console.log(`  ${key.padEnd(25)}: ${JSON.stringify(value).substring(0, 80)}`);
            });

            console.log('\n\n🎯 All Unique Fields Found:');
            console.log('='.repeat(60));
            const allFields = new Set();
            data.items.forEach(p => {
                Object.keys(p).forEach(k => allFields.add(k));
            });
            Array.from(allFields).sort().forEach(field => {
                console.log(`  • ${field}`);
            });
        } else {
            console.log('No items returned');
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testAPI();
