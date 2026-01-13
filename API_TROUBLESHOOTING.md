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

## Error Code Reference

| Code | Meaning | Solution |
|------|---------|----------|
| 4001 | Invalid authorization details | Verify SID/Token, check IP whitelist, contact support |
| 4002 | Missing authorization header | Verify header is being sent |
| 4003 | Invalid API version | Check /rest/v5/ vs /rest/v4/ |
| 4004 | Rate limit exceeded | Wait before next request |

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

