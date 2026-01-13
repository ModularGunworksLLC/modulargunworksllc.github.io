# API Sync Setup Guide

## Current Status: ⚠️ Credentials Validation Failed

The API credentials you provided are being rejected with a `401 Unauthorized` error. This requires immediate attention.

## What's Been Built

### ✅ Complete API Sync System
1. **scripts/api-sync.js** - Full-featured API sync script that:
   - Fetches products from Chattanooga Shooting API
   - Transforms data to match your schema
   - Saves to JSON files with filter metadata
   - Handles pagination (100 items per page)
   - Rate limits requests (500ms between pages)
   - Auto-commits changes to git

2. **.github/workflows/sync-products.yml** - GitHub Actions workflow that:
   - Runs on a schedule (every 4 hours)
   - Can be manually triggered from GitHub Actions tab
   - Fetches from api-integration branch
   - Creates pull requests with synced data
   - Uses repository secrets for secure credential storage

3. **scripts/validate-api.js** - Credentials validator that:
   - Tests API connection with your SID/Token
   - Provides clear error messages
   - Helps diagnose authentication issues

## API Authentication Issue

### Error Details
```
Status: 401 Unauthorized
Message: Invalid authorization details provided.
Code: 4001
```

### Possible Causes

1. **SID/Token Expired or Incorrect**
   - Credentials may need to be regenerated in your Chattanooga account
   - Check if characters were copied correctly (spaces, typos)

2. **Account Not Enabled for API Access**
   - Your account may need to be activated for dealer API access
   - Contact Chattanooga support to enable API access

3. **Different Authentication Method**
   - V5 API might use different auth than documented
   - V4 might use different credentials
   - Need to verify with Chattanooga support

## Next Steps to Fix

### Step 1: Verify Your Credentials
Go back to your Chattanooga Shooting account and:
1. Navigate to REST API Management
2. Check V5 Documentation 
3. Verify your SID and Token are correct
4. Regenerate them if needed
5. Copy them exactly (watch for extra spaces)

### Step 2: Test Credentials Locally
Once you have verified credentials:
```bash
# Set environment variables with your credentials
$env:CHATTANOOGA_API_SID='YOUR_SID_HERE'
$env:CHATTANOOGA_API_TOKEN='YOUR_TOKEN_HERE'

# Run the validator
node scripts/validate-api.js

# Should show: ✅ API credentials are VALID!
```

### Step 3: Setup GitHub Secrets
Once credentials are validated:

1. Go to your GitHub repo
2. Settings → Secrets and variables → Actions
3. Add two new secrets:
   - `CHATTANOOGA_API_SID` - Your SID
   - `CHATTANOOGA_API_TOKEN` - Your Token

### Step 4: Update the Sync Script (Optional)
The script is already configured to use environment variables:
```javascript
const API_CONFIG = {
  sid: process.env.CHATTANOOGA_API_SID || '0C0A177ED88A66B73F45A0038E8BCD2F',
  token: process.env.CHATTANOOGA_API_TOKEN || '0C0A177FD33DFC39A88DDDE319A55C92',
};
```

### Step 5: Test Sync Locally
Once credentials work:
```bash
# Set environment variables
$env:CHATTANOOGA_API_SID='YOUR_VALID_SID'
$env:CHATTANOOGA_API_TOKEN='YOUR_VALID_TOKEN'

# Test sync for single category
node scripts/api-sync.js ammunition

# Or sync all categories
node scripts/api-sync.js all
```

### Step 6: Enable GitHub Actions
1. Go to GitHub repo
2. Actions tab
3. Enable GitHub Actions
4. Workflow "Sync Products from Chattanooga API" will run on schedule

## Manual Sync Commands

### Sync Single Category
```bash
node scripts/api-sync.js ammunition
node scripts/api-sync.js guns
node scripts/api-sync.js optics
node scripts/api-sync.js gear
node scripts/api-sync.js magazines
node scripts/api-sync.js reloading
node scripts/api-sync.js gun-parts
```

### Sync All Categories
```bash
node scripts/api-sync.js all
```

## API Response Format

When working correctly, the API returns products like:
```json
{
  "items": [
    {
      "id": "123456",
      "itemNumber": "FED9115",
      "name": "Federal 9mm 115gr FMJ",
      "brand": "Federal",
      "description": "Range ammunition",
      "quantity": 450,
      "sellingPrice": 12.99,
      "mapPrice": 13.99,
      "retailPrice": 14.99,
      "image": "https://..."
    }
  ],
  "total": 1000
}
```

## Data Transformation

The sync script automatically:
1. Extracts caliber (9mm, .308, 12 Gauge, etc.)
2. Identifies bullet type (FMJ, JHP, Hollow Point, etc.)
3. Determines casing type (Brass, Steel, Aluminum)
4. Counts rounds per box
5. Categorizes ammo type (Shotgun, Rifle, Handgun, etc.)
6. Calculates stock status (in stock / out of stock)
7. Adds timestamps and metadata

## Category Mappings

| Category | API Filter | Output File |
|----------|-----------|------------|
| ammunition | Ammunition | data/products/ammunition.json |
| guns | Firearms | data/products/guns.json |
| optics | Optics & Sights | data/products/optics.json |
| gear | Tactical Gear | data/products/gear.json |
| magazines | Magazines | data/products/magazines.json |
| reloading | Reloading Supplies | data/products/reloading.json |
| gun-parts | Gun Parts | data/products/gun-parts.json |

## GitHub Actions Workflow Schedule

The workflow runs automatically at:
- 00:00 UTC
- 04:00 UTC
- 08:00 UTC
- 12:00 UTC
- 16:00 UTC
- 20:00 UTC

(Every 4 hours)

## Troubleshooting

### 401 Unauthorized Error
- Verify SID and Token are correct
- Check for extra spaces or special characters
- Try regenerating credentials in Chattanooga dashboard
- Contact Chattanooga support to verify account is API-enabled

### Connection Timeout
- Check internet connection
- Verify chattanoogashooting.com is accessible
- Try again in a few minutes (server might be down)

### Empty Results
- Category name might not match API filter
- Try with a different category
- Check API filter names in CATEGORY_MAPPINGS

### Git Commit Fails
- Ensure you have proper git configuration
- Check file permissions
- Run from the repository root directory

## API Documentation References

- V5 Docs: https://api.chattanoogashooting.com/rest/v5/ (requires auth)
- V4 Docs: https://api.chattanoogashooting.com/rest/v4/
- REST API Management: Your Chattanooga account dashboard

## What To Do Now

1. **Verify credentials** with Chattanooga - double-check SID/Token
2. **Run validator** with correct credentials to confirm they work
3. **Contact Chattanooga support** if credentials are invalid
4. **Update the script** once you have valid credentials
5. **Test locally** before enabling GitHub Actions
6. **Setup GitHub secrets** for automated syncing

Once this is resolved, your site will have live inventory that updates automatically every 4 hours! 🚀
