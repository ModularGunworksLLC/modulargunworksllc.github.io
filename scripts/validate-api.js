#!/usr/bin/env node

/**
 * Chattanooga Shooting API Credentials Validator
 * Verifies that API credentials are valid before running sync
 */

const https = require('https');
const crypto = require('crypto');
const readline = require('readline');

const API_BASE = 'api.chattanoogashooting.com';

function getAuthHeader(sid, token) {
  const md5Token = crypto.createHash('md5').update(token).digest('hex');
  const credentials = `${sid}:${md5Token}`;
  const encoded = Buffer.from(credentials).toString('base64');
  return `Basic ${encoded}`;
}

function testApiConnection(sid, token) {
  return new Promise((resolve) => {
    const authHeader = getAuthHeader(sid, token);
    
    const options = {
      hostname: API_BASE,
      path: '/rest/v5/items?limit=1',
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'User-Agent': 'ModularGunworks/1.0',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          message: res.statusCode === 200 ? 'Success!' : 'Failed',
          data: data,
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        statusCode: 0,
        message: `Connection error: ${err.message}`,
        data: null,
      });
    });

    setTimeout(() => {
      req.abort();
      resolve({
        statusCode: 0,
        message: 'Request timeout',
        data: null,
      });
    }, 5000);

    req.end();
  });
}

async function validateCredentials(sid, token) {
  console.log('\n🔍 Validating API credentials...\n');
  console.log(`SID: ${sid.substring(0, 8)}...${sid.substring(sid.length - 4)}`);
  console.log(`Token: ${token.substring(0, 8)}...${token.substring(token.length - 4)}\n`);

  const result = await testApiConnection(sid, token);

  if (result.statusCode === 200) {
    console.log('✅ API credentials are VALID!');
    console.log('Status: 200 OK');
    return true;
  } else {
    console.log('❌ API credentials are INVALID!');
    console.log(`Status: ${result.statusCode} ${result.message}`);
    if (result.data) {
      try {
        const parsed = JSON.parse(result.data);
        console.log(`Error: ${parsed.message || parsed.error}`);
        console.log(`Code: ${parsed.error_code}`);
      } catch (e) {
        console.log(`Response: ${result.data}`);
      }
    }
    return false;
  }
}

// Main
const sid = process.env.CHATTANOOGA_API_SID;
const token = process.env.CHATTANOOGA_API_TOKEN;

if (!sid || !token) {
  console.log('\n❌ Missing API credentials!');
  console.log('\nSet environment variables:');
  console.log('  export CHATTANOOGA_API_SID="your_sid"');
  console.log('  export CHATTANOOGA_API_TOKEN="your_token"');
  console.log('\nThen run: node scripts/validate-api.js\n');
  process.exit(1);
}

validateCredentials(sid, token).then(valid => {
  process.exit(valid ? 0 : 1);
});
