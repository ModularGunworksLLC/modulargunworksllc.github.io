# API Authentication Setup - For Chattanooga Support Verification

**Account:** Modular Gunworks LLC  
**Date:** January 13, 2026

---

## Authentication Method

**Format:** `Basic [Your SID]:[MD5 Hash of your token]`  
**Endpoint:** `https://api.chattanoogashooting.com/rest/v4/` (or v5)

---

## Step-by-Step Authentication Process

### Step 1: Raw Credentials
```
SID:   3E5B1B51AB84E327E32E0CE4478B84AD
Token: 3E5B1B52C8F5F75446E38A1BBA9706B3
```

### Step 2: Generate MD5 Hash of Token
```
Token:       3E5B1B52C8F5F75446E38A1BBA9706B3
MD5 Hash:    f3cf736deab8ed69280229c8ff095e51
```

### Step 3: Combine SID + MD5(Token) with Colon
```
SID:MD5(Token):
3E5B1B51AB84E327E32E0CE4478B84AD:f3cf736deab8ed69280229c8ff095e51
```

### Step 4: Base64 Encode the Combined String
```
String to encode:
3E5B1B51AB84E327E32E0CE4478B84AD:f3cf736deab8ed69280229c8ff095e51

Base64 Result:
M0U1QjFCNTFBQjg0RTMyN0UzMkUwQ0U0NDc4Qjg0QUQ6ZjNjZjczNmRlYWI4ZWQ2OTI4MDIyOWM4ZmYwOTVlNTE=
```

### Step 5: Create Authorization Header
```
Authorization: Basic M0U1QjFCNTFBQjg0RTMyN0UzMkUwQ0U0NDc4Qjg0QUQ6ZjNjZjczNmRlYWI4ZWQ2OTI4MDIyOWM4ZmYwOTVlNTE=
```

---

## HTTP Request Format

```
GET /rest/v4/items?limit=1 HTTP/1.1
Host: api.chattanoogashooting.com
Authorization: Basic M0U1QjFCNTFBQjg0RTMyN0UzMkUwQ0U0NDc4Qjg0QUQ6ZjNjZjczNmRlYWI4ZWQ2OTI4MDIyOWM4ZmYwOTVlNTE=
User-Agent: ModularGunworks/1.0
```

---

## Verification Checklist for Chattanooga Support

**Please verify:**
- [ ] SID `3E5B1B51AB84E327E32E0CE4478B84AD` is correct and active
- [ ] Token `3E5B1B52C8F5F75446E38A1BBA9706B3` is correct and active
- [ ] These credentials are from the same API key pair (not mixed)
- [ ] Account has "API Access Enabled" for both V4 and V5
- [ ] No IP whitelist blocking requests from our IP address
- [ ] API reset completed successfully on 1/13/2026
- [ ] Confirm that `error_code 4001` should NOT be returned for these credentials

---

## Current Status

**Testing Tool:** Node.js HTTPS request  
**API Version Tested:** V4 and V5  
**Current Response:** Status 401 with error_code 4001 ("Invalid authorization details provided")  
**Authentication Format:** ✅ Verified correct  
**MD5 Hash:** ✅ Verified correct  
**Base64 Encoding:** ✅ Verified correct  
**HTTPS Connection:** ✅ Successfully established  
**Credentials:** ❌ Being rejected by API

---

## Testing Code

```javascript
const https = require('https');
const crypto = require('crypto');

const SID = '3E5B1B51AB84E327E32E0CE4478B84AD';
const TOKEN = '3E5B1B52C8F5F75446E38A1BBA9706B3';

// Step 2: MD5 Hash the token
const md5Token = crypto.createHash('md5').update(TOKEN).digest('hex');

// Step 3: Combine SID:MD5(Token)
const credentials = `${SID}:${md5Token}`;

// Step 4: Base64 encode
const encoded = Buffer.from(credentials).toString('base64');

// Step 5: Create header
const authHeader = `Basic ${encoded}`;

// Step 6: Make request
const options = {
  hostname: 'api.chattanoogashooting.com',
  path: '/rest/v4/items?limit=1',
  method: 'GET',
  headers: {
    'Authorization': authHeader,
    'User-Agent': 'ModularGunworks/1.0',
  },
};

https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  // Handle response...
}).end();
```

---

## What We Need From Chattanooga

Please confirm:
1. Are these credentials currently active and valid?
2. Is API access fully enabled on the account?
3. Are there any IP restrictions we should know about?
4. Should we use a different endpoint format?
5. Do we need any additional headers or parameters?
6. Is there a delay before new credentials become active?

---

**Contact:** Michael @ Modular Gunworks LLC  
**Urgent:** Awaiting credentials verification to launch live inventory integration
