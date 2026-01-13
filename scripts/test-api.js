const https = require('https');
const crypto = require('crypto');

const sid = '2C50AEB30FFDCC9078F0C8F3172C8111';
const token = '2C50AEB4AFBC56113AC9CA1C78A875C2';
const md5 = crypto.createHash('md5').update(token).digest('hex');
const auth = 'Basic ' + Buffer.from(sid + ':' + md5).toString('base64');

console.log('Testing API endpoints...\n');

async function test(path) {
  return new Promise(resolve => {
    const options = {
      hostname: 'api.chattanoogashooting.com',
      path: path,
      method: 'GET',
      headers: {
        'Authorization': auth,
        'User-Agent': 'ModularGunworks/1.0'
      }
    };

    const req = https.request(options, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        console.log(`GET ${path}`);
        console.log(`Status: ${res.statusCode}`);
        
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(data);
            console.log(`✅ SUCCESS - Items: ${json.items ? json.items.length : 'unknown'}`);
          } catch(e) {
            console.log('Response:', data.substring(0, 100));
          }
        } else {
          try {
            const err = JSON.parse(data);
            console.log(`❌ ${err.message}`);
          } catch(e) {
            console.log('Error:', data.substring(0, 100));
          }
        }
        console.log('');
        resolve();
      });
    });

    req.on('error', e => {
      console.log(`Connection Error: ${e.message}\n`);
      resolve();
    });

    setTimeout(() => {
      req.abort();
      resolve();
    }, 5000);

    req.end();
  });
}

(async () => {
  await test('/rest/v5/items?limit=1');
  await test('/rest/v4/items?limit=1');
})();
