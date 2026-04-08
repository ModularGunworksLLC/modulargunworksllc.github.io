// Fetch product feed CSV URL and download the CSV file
async function fetchProductFeed({ manufacturer_ids = '', optional_columns = '' } = {}) {
  console.log('Requesting product feed CSV URL...');
  const params = {};
  if (manufacturer_ids) params.manufacturer_ids = manufacturer_ids;
  if (optional_columns) params.optional_columns = optional_columns;
  const data = await fetchChattanooga('/items/product-feed', params);
  const url = data.product_feed && data.product_feed.url;
  if (!url) throw new Error('No product feed URL returned.');
  console.log('Product feed CSV URL:', url);

  // Download the CSV file
  const outDir = path.join(__dirname, '../data/products');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const csvPath = path.join(outDir, 'chattanooga-product-feed.csv');
  const httpModule = url.startsWith('https') ? require('https') : require('http');
  await new Promise((resolve, reject) => {
    const file = fs.createWriteStream(csvPath);
    httpModule.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error('Failed to download CSV: HTTP ' + res.statusCode));
        return;
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', reject);
  });
  console.log('Product feed CSV downloaded to', csvPath);
}

// --- ITEM PROPERTIES ---
async function getItemProperties() {
  console.log('Fetching item properties...');
  const data = await fetchChattanooga('/item-properties');
  const outDir = path.join(__dirname, '../data/products');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'chattanooga-item-properties.json'), JSON.stringify(data, null, 2));
  console.log('Fetched and saved item properties.');
  return data;
}

async function createItemProperty(name, data_type) {
  console.log('Creating item property:', name, data_type);
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ name, data_type });
    const url = new URL(API_BASE + '/item-properties');
    const options = {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeader(),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error('Failed to parse JSON: ' + e.message));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function deleteItemProperty(property_id) {
  console.log('Deleting item property:', property_id);
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + `/item-properties/${property_id}`);
    const options = {
      method: 'DELETE',
      headers: {
        'Authorization': getAuthHeader(),
        'Accept': 'application/json'
      }
    };
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error('Failed to parse JSON: ' + e.message));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function assignItemPropertyValues(property_id, items) {
  console.log('Assigning item property values:', property_id, items);
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ items });
    const url = new URL(API_BASE + `/item-properties/${property_id}/items`);
    const options = {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeader(),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error('Failed to parse JSON: ' + e.message));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function removeItemPropertyValues(property_id, items = undefined) {
  console.log('Removing item property values:', property_id, items);
  return new Promise((resolve, reject) => {
    const postData = items ? JSON.stringify({ items }) : '';
    const url = new URL(API_BASE + `/item-properties/${property_id}/items`);
    const options = {
      method: 'DELETE',
      headers: {
        'Authorization': getAuthHeader(),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error('Failed to parse JSON: ' + e.message));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

// --- ORDERS ---
async function getOrders(params = {}) {
  console.log('Fetching orders...');
  const data = await fetchChattanooga('/orders', params);
  const outDir = path.join(__dirname, '../data/products');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'chattanooga-orders.json'), JSON.stringify(data, null, 2));
  console.log('Fetched and saved orders.');
  return data;
}

async function createOrder(order) {
  console.log('Creating order:', order);
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(order);
    const url = new URL(API_BASE + '/orders');
    const options = {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeader(),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error('Failed to parse JSON: ' + e.message));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function getOrder(order_number) {
  console.log('Fetching order:', order_number);
  const data = await fetchChattanooga(`/orders/${order_number}`);
  return data;
}

async function getOrderShipments(order_number) {
  console.log('Fetching order shipments:', order_number);
  const data = await fetchChattanooga(`/orders/${order_number}/shipments`);
  return data;
}

async function requestOrderCancellation({ order_number, purchase_order_number }) {
  console.log('Requesting order cancellation:', order_number || purchase_order_number);
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(order_number ? { order_number } : { purchase_order_number });
    const url = new URL(API_BASE + '/orders/request-cancellation');
    const options = {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeader(),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error('Failed to parse JSON: ' + e.message));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// --- SHIPMENTS ---
async function getShipmentsByOrder(params = {}) {
  console.log('Fetching shipments by order...');
  const data = await fetchChattanooga('/shipments/by-order', params);
  const outDir = path.join(__dirname, '../data/products');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'chattanooga-shipments-by-order.json'), JSON.stringify(data, null, 2));
  console.log('Fetched and saved shipments by order.');
  return data;
}

async function getShipmentsByPurchaseOrder(params = {}) {
  console.log('Fetching shipments by purchase order...');
  const data = await fetchChattanooga('/shipments/by-purchase-order', params);
  const outDir = path.join(__dirname, '../data/products');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'chattanooga-shipments-by-po.json'), JSON.stringify(data, null, 2));
  console.log('Fetched and saved shipments by purchase order.');
  return data;
}

async function markShipmentsAsReceived(order_numbers) {
  console.log('Marking shipments as received:', order_numbers);
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ order_numbers });
    const url = new URL(API_BASE + '/shipments/mark-as-received');
    const options = {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeader(),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error('Failed to parse JSON: ' + e.message));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// --- INVOICES ---
async function getInvoicesByOrder(params = {}) {
  console.log('Fetching invoices by order...');
  const data = await fetchChattanooga('/invoices/by-order', params);
  const outDir = path.join(__dirname, '../data/products');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'chattanooga-invoices-by-order.json'), JSON.stringify(data, null, 2));
  console.log('Fetched and saved invoices by order.');
  return data;
}

async function getInvoicesByPurchaseOrder(params = {}) {
  console.log('Fetching invoices by purchase order...');
  const data = await fetchChattanooga('/invoices/by-purchase-order', params);
  const outDir = path.join(__dirname, '../data/products');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'chattanooga-invoices-by-po.json'), JSON.stringify(data, null, 2));
  console.log('Fetched and saved invoices by purchase order.');
  return data;
}

async function markInvoicesAsReceived(order_numbers) {
  console.log('Marking invoices as received:', order_numbers);
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ order_numbers });
    const url = new URL(API_BASE + '/invoices/mark-as-received');
    const options = {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeader(),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error('Failed to parse JSON: ' + e.message));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}
// scripts/sync-chattanooga-api.js
// Sync products from Chattanooga Shooting REST API (V5)
// Usage: Set API_SID and API_TOKEN in your environment before running
// Example: API_SID=your_sid API_TOKEN=your_token node scripts/sync-chattanooga-api.js


require('dotenv').config();
const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

const API_BASE = 'https://api.chattanoogashooting.com/rest/v5';
const API_SID = process.env.API_SID;
const API_TOKEN = process.env.API_TOKEN;

if (!API_SID || !API_TOKEN) {
  console.error('❌ Error: API_SID and API_TOKEN environment variables are required.');
  process.exit(1);
}

function md5(str) {
  return crypto.createHash('md5').update(str).digest('hex');
}

function getAuthHeader() {
  // Format: Basic [SID]:[MD5 Hash of Token] (not base64-encoded)
  const tokenHash = md5(API_TOKEN);
  return `Basic ${API_SID}:${tokenHash}`;
}

function fetchChattanooga(endpoint, params = {}) {
  const url = new URL(API_BASE + endpoint);
  Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));

  return new Promise((resolve, reject) => {
    const options = {
      method: 'GET',
      headers: {
        'Authorization': getAuthHeader(),
        'Accept': 'application/json',
      },
    };
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error('Failed to parse JSON: ' + e.message));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    }).on('error', reject);
  });
}

async function fetchAllItems() {
  let page = 1;
  let per_page = 50; // API max per_page is 50
  let allItems = [];
  let hasMore = true;

  while (hasMore) {
    console.log(`Fetching items page ${page}...`);
    const data = await fetchChattanooga('/items', { page, per_page });
    const items = data.items || [];
    allItems = allItems.concat(items);
    // Pagination info: data.pagination.page, data.pagination.page_count
    hasMore = data.pagination && data.pagination.page < data.pagination.page_count;
    page++;
  }
  return allItems;
}

async function main() {
  try {
    // Fetch all items as JSON
    const items = await fetchAllItems();
    console.log(`Fetched ${items.length} items.`);
    const outDir = path.join(__dirname, '../data/products');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'chattanooga-items.json'), JSON.stringify({ items }, null, 2));
    console.log('Items saved to data/products/chattanooga-items.json');

    // Fetch and download product feed CSV
    await fetchProductFeed();

    // Fetch and save item properties
    await getItemProperties();

    // Example usage for other endpoints (uncomment to use):
    // await createItemProperty('Favorite Item', 'boolean');
    // await assignItemPropertyValues('favorite-item', [{ item_number: 'CC3509', value: 1 }]);
    // await removeItemPropertyValues('favorite-item', ['CC3509']);
    // await deleteItemProperty('favorite-item');
    // await getOrders();
    // await createOrder({ ... });
    // await getOrder(1);
    // await getOrderShipments(1);
    // await requestOrderCancellation({ order_number: 1 });
    // await getShipmentsByOrder();
    // await getShipmentsByPurchaseOrder();
    // await markShipmentsAsReceived([1,2]);
    // await getInvoicesByOrder();
    // await getInvoicesByPurchaseOrder();
    // await markInvoicesAsReceived([1,2]);
  } catch (err) {
    console.error('Sync failed:', err.message);
    process.exit(1);
  }
}

main();
