#!/usr/bin/env node

/**
 * Chattanooga Shooting API v4 - CORRECT FORMAT
 * No Base64 encoding - raw format: Basic SID:MD5HASH
 */

const https = require('https');
const crypto = require('crypto');

const SID = '3E5B1B51AB84E327E32E0CE4478B84AD';
const TOKEN = '3E5B1B52C8F5F75446E38A1BBA9706B3';

console.log('🔌 Connecting to Chattanooga Shooting API v4\n');

// Step 1: MD5 hash the token (lowercase hex)
const md5Hash = crypto.createHash('md5').update(TOKEN).digest('hex');

// Step 2: Create header WITHOUT Base64 encoding
// Format: Basic [SID]:[MD5HASH]
const authHeader = `Basic ${SID}:${md5Hash}`;

console.log('Authentication Details:');
console.log(`  SID:        ${SID}`);
console.log(`  Token:      ${TOKEN}`);
console.log(`  MD5(Token): ${md5Hash}`);
console.log(`  Header:     ${authHeader}\n`);

const options = {
  hostname: 'api.chattanoogashooting.com',
  path: '/rest/v4/items',
  method: 'GET',
  headers: {
    'Authorization': authHeader,
    'User-Agent': 'ModularGunworks/1.0',
    'Content-Type': 'application/json',
  },
};

console.log('Making GET request to: https://api.chattanoogashooting.com/rest/v4/items\n');

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`HTTP Status: ${res.statusCode}`);
    console.log(`Response:\n${data}\n`);

    if (res.statusCode === 200) {
      console.log('✅ SUCCESS - Connected to API!');
      try {
        const json = JSON.parse(data);
        if (json.items) {
          console.log(`Items returned: ${json.items.length}`);
        }
      } catch (e) {
        console.log('Response is JSON');
      }
    } else if (res.statusCode === 401) {
      console.log('❌ FAILED - 401 Unauthorized');
      console.log('   The SID/Token credentials are invalid or account access is not enabled');
    } else if (res.statusCode === 422) {
      console.log('❌ FAILED - 422 Invalid Data');
      console.log('   Check request parameters');
    } else {
      console.log(`❌ FAILED - Status ${res.statusCode}`);
    }
  });
});

req.on('error', (error) => {
  console.error(`❌ Connection error: ${error.message}`);
  process.exit(1);
});

req.end();
