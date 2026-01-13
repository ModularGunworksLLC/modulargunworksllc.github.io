#!/usr/bin/env node

/**
 * Simple V4 API Connection Test
 * Tests raw connection with detailed logging
 */

const https = require('https');
const crypto = require('crypto');

const SID = '3E5B1B51AB84E327E32E0CE4478B84AD';
const TOKEN = '3E5B1B52C8F5F75446E38A1BBA9706B3';

console.log('🧪 Testing Chattanooga V4 API Connection\n');

// Generate auth header
const md5Token = crypto.createHash('md5').update(TOKEN).digest('hex');
const credentials = `${SID}:${md5Token}`;
const encoded = Buffer.from(credentials).toString('base64');
const authHeader = `Basic ${encoded}`;

console.log('Credentials:');
console.log(`  SID: ${SID}`);
console.log(`  Token: ${TOKEN}`);
console.log(`  MD5(Token): ${md5Token}`);
console.log(`  Base64: ${encoded}`);
console.log(`  Authorization Header: ${authHeader}\n`);

const options = {
  hostname: 'api.chattanoogashooting.com',
  path: '/rest/v4/items?limit=1',
  method: 'GET',
  headers: {
    'Authorization': authHeader,
    'User-Agent': 'ModularGunworks/1.0',
    'Content-Type': 'application/json',
  },
};

console.log('Making request to: https://api.chattanoogashooting.com/rest/v4/items?limit=1\n');

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers: ${JSON.stringify(res.headers, null, 2)}\n`);
    console.log(`Response:\n${data}`);

    if (res.statusCode === 200) {
      console.log('\n✅ SUCCESS - API is responding correctly!');
    } else {
      console.log(`\n❌ FAILED - API returned status ${res.statusCode}`);
    }
  });
});

req.on('error', (error) => {
  console.error(`Request error: ${error.message}`);
});

req.end();
