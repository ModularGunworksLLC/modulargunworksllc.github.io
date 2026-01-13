#!/usr/bin/env node

/**
 * Chattanooga API Authentication Diagnostic
 * Tests various auth scenarios and provides detailed feedback
 */

const https = require('https');
const crypto = require('crypto');

const SID = '3E5B1B51AB84E327E32E0CE4478B84AD';
const TOKEN = '3E5B1B52C8F5F75446E38A1BBA9706B3';

console.log('🔍 Chattanooga API Authentication Diagnostic\n');
console.log('=' .repeat(60));

// Step 1: Verify credentials format
console.log('\n1. CREDENTIALS VERIFICATION');
console.log('-'.repeat(60));
console.log(`SID Length: ${SID.length} chars`);
console.log(`Token Length: ${TOKEN.length} chars`);
console.log(`SID (first 8): ${SID.substring(0, 8)}...${SID.substring(SID.length - 4)}`);
console.log(`Token (first 8): ${TOKEN.substring(0, 8)}...${TOKEN.substring(TOKEN.length - 4)}`);

// Check for whitespace
if (SID.trim() !== SID) console.log('⚠️  WARNING: SID has leading/trailing whitespace');
if (TOKEN.trim() !== TOKEN) console.log('⚠️  WARNING: Token has leading/trailing whitespace');

// Step 2: Generate MD5
console.log('\n2. MD5 HASH GENERATION');
console.log('-'.repeat(60));
const md5Token = crypto.createHash('md5').update(TOKEN).digest('hex');
console.log(`MD5(Token): ${md5Token}`);

// Step 3: Build auth header
console.log('\n3. AUTHORIZATION HEADER');
console.log('-'.repeat(60));
const credentials = `${SID}:${md5Token}`;
console.log(`Format: SID:MD5(Token)`);
console.log(`String: ${credentials}`);

const b64 = Buffer.from(credentials).toString('base64');
console.log(`Base64: ${b64.substring(0, 40)}...`);

const authHeader = `Basic ${b64}`;
console.log(`Header: ${authHeader.substring(0, 40)}...`);

// Step 4: Test API endpoints
console.log('\n4. API ENDPOINT TESTS');
console.log('-'.repeat(60));

async function testEndpoint(path, description) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.chattanoogashooting.com',
      path: path,
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'User-Agent': 'DiagnosticTool/1.0',
        'Content-Type': 'application/json',
      },
    };

    console.log(`\nTesting: ${description}`);
    console.log(`Path: ${path}`);

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        
        if (res.statusCode === 200) {
          console.log('✅ SUCCESS');
          try {
            const json = JSON.parse(data);
            if (json.items) {
              console.log(`Items returned: ${json.items.length}`);
              if (json.items.length > 0) {
                console.log(`First item: ${json.items[0].name || json.items[0].id}`);
              }
            }
          } catch (e) {
            console.log(`Response: ${data.substring(0, 100)}`);
          }
        } else if (res.statusCode === 401) {
          console.log('❌ FAILED - 401 Unauthorized (Error 4001)');
          console.log('   This means:');
          console.log('   • SID or Token is incorrect');
          console.log('   • API access not enabled on account');
          console.log('   • Account lacks necessary permissions');
          try {
            const err = JSON.parse(data);
            console.log(`   Error: ${err.message}`);
          } catch (e) {}
        } else {
          console.log('❌ FAILED');
          try {
            const err = JSON.parse(data);
            console.log(`Error: ${err.message}`);
            console.log(`Code: ${err.error_code}`);
          } catch (e) {
            console.log(`Response: ${data.substring(0, 100)}`);
          }
        }

        resolve();
      });
    });

    req.on('error', (err) => {
      console.log(`❌ Connection Error: ${err.message}`);
      resolve();
    });

    req.end();
  });
}

(async () => {
  await testEndpoint('/rest/v5/items?limit=1', 'V5 - Get Items (1 item)');
  await new Promise(r => setTimeout(r, 1000));
  
  await testEndpoint('/rest/v5/items?skip=0&limit=5', 'V5 - Get Items (5 items)');
  await new Promise(r => setTimeout(r, 1000));
  
  await testEndpoint('/rest/v4/items?limit=1', 'V4 - Get Items (compatibility test)');
  await new Promise(r => setTimeout(r, 1000));

  // Step 5: Summary
  console.log('\n' + '='.repeat(60));
  console.log('5. DIAGNOSTIC SUMMARY');
  console.log('-'.repeat(60));
  console.log(`Auth Format: ✅ Correct (Basic SID:MD5(Token))`);
  console.log(`Credentials: ${SID.trim() === SID && TOKEN.trim() === TOKEN ? '✅ Clean' : '⚠️  May have whitespace'}`);
  console.log(`MD5 Hash: ✅ Generated`);
  console.log('\nPossible Issues:');
  console.log('1. SID/Token may be incorrect - verify in Chattanooga dashboard');
  console.log('2. Account may not be fully activated for API access');
  console.log('3. IP address may be on a whitelist');
  console.log('4. API endpoint structure may have changed');
  console.log('5. Request headers may need additional fields');
  console.log('\nNext Steps:');
  console.log('1. Log into your Chattanooga Shooting account');
  console.log('2. Go to REST API Management');
  console.log('3. Copy SID and Token exactly (watch for spaces)');
  console.log('4. Verify "API Access Enabled" checkbox is checked');
  console.log('5. Check if there are any IP restrictions');
  console.log('6. Contact Chattanooga support if still not working');
  console.log('=' .repeat(60) + '\n');

  process.exit(0);
})();
