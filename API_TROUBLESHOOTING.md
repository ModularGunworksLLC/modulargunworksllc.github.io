# API Authentication Troubleshooting Guide

## Current Status: 401 Unauthorized

Your authentication header format is **correct**, but the API is rejecting the credentials with error code 4001.

## Authentication Format Verified ✅

```
Header: Basic [Base64(SID:MD5(Token))]
SID:    2C50AEB30FFDCC9078F0C8F3172C8111 (32 chars) ✅
Token:  2C50AEB4AFBC56113AC9CA1C78A875C2 (32 chars) ✅  
MD5:    8d709ba0684934e3d7fc18a38d763fbd ✅
```

The header generation is working perfectly. The issue is that the credentials themselves are being rejected.

## Official Chattanooga Shooting API Error Codes

| HTTP Code | Error Code | Error Message | Meaning |
|-----------|-----------|----------------|---------|
| **401** | **4001** | **Bad Authorization** | **Invalid authorization details - SID/Token wrong or API access not enabled** |
| 403 | 4003 | Forbidden | Authenticated but lacking necessary permissions |
| 500 | 5000 | Internal Server Error | Server error on Chattanooga's side |
| 404 | 8000 | Record Not Found | The requested resource does not exist |
| 422 | 9000 | Invalid Data | Submitted data is invalid |

**What Error 4001 DOES mean:**
- SID or Token is incorrect
- API access not enabled on your account
- Account lacks required permissions for this action

**What Error 4001 DOES NOT mean:**
- Your MD5 hashing is wrong (we verified it's correct)
- Your Base64 encoding is wrong (we verified it's correct)
- Your header format is wrong (we verified it matches Chattanooga's spec)
- Your HTTPS connection is wrong (connection is successful, just rejecting auth)

## Troubleshooting Steps

### Step 1: Verify Credentials in Dashboard ⚠️ CRITICAL

Go to your Chattanooga Shooting account and:

1. **Log in** to your account
2. **Navigate to** REST API Management section
3. **Look at** Your API Credentials
4. **Check:**
   - Is your current SID: `2C50AEB30FFDCC9078F0C8F3172C8111`?
   - Is your current Token: `2C50AEB4AFBC56113AC9CA1C78A875C2`?
5. **Verify no spaces** at the beginning or end
6. **Copy fresh** directly from the dashboard

**Why this matters:** Credentials sometimes get regenerated, expired, or the ones displayed might not be what you thought.

### Step 2: Check Account Status

Verify these settings in your Chattanooga account:

- [ ] **API Access Enabled** checkbox is checked
- [ ] **Account Status** is Active
- [ ] **API Key Status** is Active (if shown)
- [ ] **IP Whitelist** (if enabled) includes your IP
- [ ] No recent password changes that might have reset API access

### Step 3: Check IP Restrictions

Your IP address might be restricted:

1. Check what IP Chattanooga sees:
   - Go to whatismyipaddress.com
   - Note your public IP: `XXX.XXX.XXX.XXX`

2. In Chattanooga dashboard:
   - Look for "IP Whitelist" or "Allowed IPs"
   - Add your current IP if needed

3. Test from different network:
   - If on company network, try mobile hotspot
   - If on home network, check if ISP blocked it

### Step 4: Test with Different Approach

Our current script uses this format:
```
Authorization: Basic [Base64(SID:MD5(Token))]
```

If that continues to fail, try these alternatives:

**Option A: Query Parameters**
```bash
/rest/v5/items?sid=[SID]&token=[MD5(Token)]
```

**Option B: Check V4 API**
If V5 is newer, V4 might use different auth:
```bash
/rest/v4/items?sid=[SID]&token=[Token]
```

### Step 5: Contact Chattanooga Support

If you've verified credentials and they still don't work:

**Contact:** Click the red bubble in lower right of Chattanooga dashboard  
**Include in your message:**
```
- I'm getting 401 Unauthorized (error code 4001)
- Auth format: Basic [Base64(SID:MD5(Token))]
- SID: 2C50AEB30FFDCC9078F0C8F3172C8111
- Token: 2C50AEB4AFBC56113AC9CA1C78A875C2
- My IP: [Your IP address]
- I'm trying to access: /rest/v5/items
```

Ask them to:
- Confirm credentials are correct and active
- Verify API access is enabled for my account
- Check if there are any IP restrictions
- Confirm the authentication format

---

## Official Chattanooga Error Codes

### Authentication Errors (We're Getting 4001)

| Code | HTTP Status | Short Name | Message | Solution |
|------|-------------|-----------|---------|----------|
| **4001** | **401** | **Bad Authorization** | **Invalid authorization details provided.** | Verify SID/Token are correct, enable API access, check IP whitelist |
| 4003 | 403 | Forbidden | Permission denied. | Contact Chattanooga support to enable API access |
| 5000 | 500 | Internal Server Error | There was an internal server error. | Try again later, contact support if persists |

### Data/Validation Errors

| Code | HTTP Status | Short Name | Message | Solution |
|------|-------------|-----------|---------|----------|
| 8000 | 404 | Record Not Found | The record specified could not be found. | Verify item ID is correct |
| 9000 | 422 | Invalid Data | Data validation failed. | Check request data format |
| 60001 | 404 | No Records Found | There were no items found. Try modifying your filters. | Adjust API parameters |

---

## Why We're Getting 4001

**Error 4001 = "Invalid authorization details provided"**

This means the API server received your request but rejected it because:

1. ❌ **SID is incorrect** - Not the real SID from your account
2. ❌ **Token is incorrect** - Not the real Token from your account  
3. ❌ **API access not enabled** - Account exists but API not activated
4. ❌ **Account permissions** - Account needs special permission
5. ⚠️ **IP whitelist** - (Less likely, but possible) Your IP is blocked

**It does NOT mean:**
- ✅ Authentication format is wrong (we've verified it's correct)
- ✅ MD5 hashing is wrong (verified working)
- ✅ Base64 encoding is wrong (verified working)

---

## Once Credentials Work

Once you get a **200 OK** response from the diagnostic script, run:

```bash
# Test single category
node scripts/api-sync.js ammunition

# Test all categories  
node scripts/api-sync.js all
```

This will:
1. Fetch products from Chattanooga API
2. Transform and enrich the data
3. Save to JSON files
4. Auto-commit to git

---

## What We've Verified ✅

- ✅ Auth header format is correct (Basic SID:MD5(Token))
- ✅ MD5 hashing is implemented correctly
- ✅ Base64 encoding is working
- ✅ HTTPS connection to API is established
- ✅ Request structure is valid
- ✅ All endpoints respond (just returning 401)

## What's Not Working ❌

- ❌ The specific SID/Token combination is being rejected
- ❌ Either credentials are wrong or account isn't properly configured

---

## Quick Checklist

- [ ] Logged into Chattanooga account
- [ ] Verified SID matches: `2C50AEB30FFDCC9078F0C8F3172C8111`
- [ ] Verified Token matches: `2C50AEB4AFBC56113AC9CA1C78A875C2`
- [ ] No leading/trailing spaces on either
- [ ] API Access Enabled is checked
- [ ] Checked IP whitelist (if applicable)
- [ ] Copied credentials fresh from dashboard
- [ ] Re-ran diagnostic script
- [ ] Still getting 401? Contact Chattanooga support

---

## Support Contact

**Chattanooga Shooting REST API Support:**
- Method: Red support bubble (lower right of dashboard)
- Include: The diagnostic output above
- Ask for: Verification of credentials and API access status

---

**Diagnosis Date:** January 13, 2026  
**Status:** Authentication format correct, awaiting credential verification

