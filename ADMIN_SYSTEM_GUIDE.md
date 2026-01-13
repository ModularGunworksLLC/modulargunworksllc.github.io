# Google Drive Admin System - Service Account Setup

## ✅ Status: Ready to Use

**Server:** http://localhost:3001  
**Admin Dashboard:** http://localhost:3001/admin.html  
**Authentication:** admin / modulargunworks2024

### ✅ Google Drive Status
- ✓ Service account authenticated
- ✓ All 9 product folders created automatically
- ✓ Folder structure ready for image uploads
- ✓ No token expiration issues (service account renewal is automatic)

---

## 📁 Current Folder Structure on Google Drive

Your service account automatically created these folders in Google Drive:

```
Google Drive Root
├── Ammunition
├── Firearms
├── Optics & Sights
├── Magazines
├── Gun Parts
├── Tactical Gear
├── Reloading Supplies
├── Survival Gear
└── Other Products
```

---

## 🔧 How to Customize Folder Names

### Edit Folder Names

Open [google-drive-config.js](google-drive-config.js) and modify the `categoryFolders` object:

```javascript
categoryFolders: {
  ammunition: 'Ammunition',      // Change to any name you want
  guns: 'Firearms',              // Example: 'Guns & Firearms'
  optics: 'Optics & Sights',     // Example: 'Optics'
  magazines: 'Magazines',        // Example: 'Mag Storage'
  'gun-parts': 'Gun Parts',      // Example: 'Parts & Accessories'
  gear: 'Tactical Gear',         // Example: 'Gear'
  reloading: 'Reloading Supplies', // Example: 'Reloading'
  survival: 'Survival Gear',     // Example: 'Survival'
  other: 'Other Products'        // Example: 'Misc'
}
```

**Note:** Don't change the keys (left side) - those are your category codes. Only change the values (right side - the folder names on Google Drive).

### After Changing Names

1. **Delete old folders** from Google Drive (optional)
2. **Restart the server:**
   ```bash
   Stop-Process -Name node
   node admin.js
   ```
3. New folders with updated names will be created automatically

---

## 🌐 Using a Specific Google Drive Folder

By default, folders are created in your Google Drive root. To use a specific parent folder:

### Option 1: Environment Variable
Set `GOOGLE_DRIVE_PARENT_FOLDER` before starting:

```bash
$env:GOOGLE_DRIVE_PARENT_FOLDER = "your-folder-id-here"
node admin.js
```

### Option 2: Modify google-drive-config.js
```javascript
parentFolder: 'your-folder-id-here', // Instead of 'root'
```

### Option 3: Create a .env file
```
GOOGLE_DRIVE_PARENT_FOLDER=your-folder-id-here
```

### How to Find Your Folder ID
1. Open Google Drive in browser
2. Navigate to your folder
3. Look at the URL: `https://drive.google.com/drive/folders/`**FOLDER_ID_IS_HERE**
4. Copy everything after `/folders/`

---

## 📤 Admin Dashboard Features

### CSV Import
1. Upload a CSV file with product data
2. Preview products with checkboxes
3. Select specific products to import (or select all)
4. Choose merge or replace mode
5. Products are updated in the system

### Image Upload
**Single Image:**
1. Choose category
2. Enter SKU (optional)
3. Upload image
4. Image automatically goes to Google Drive
5. Product in database gets image URL

**Bulk Upload (ZIP):**
1. Create ZIP with images (in subfolder matching category if organized)
2. Choose category
3. Upload ZIP
4. All images uploaded to Google Drive
5. Progress shown for each file

### Product Search
- Search by SKU, name, or brand
- Real-time results across all 81k products
- Click to view product details

### Dashboard Stats
- Total products by category
- Quick action buttons
- Recent activity

---

## 🔐 Security Notes

### Change Default Password!
Currently using: `admin` / `modulargunworks2024`

To change, set environment variable:
```bash
$env:ADMIN_PASS = "your-new-secure-password"
node admin.js
```

Or edit google-drive-config.js:
```javascript
// At top of admin.js
const ADMIN_PASSWORD = 'your-new-password';
```

### Service Account Security
- Private key is in `google-credentials.json`
- **DO NOT** commit this file to GitHub
- Add to `.gitignore`:
  ```
  google-credentials.json
  .env
  node_modules/
  ```

---

## 📊 Storage & Costs

### Google Drive Limits
- **Free Tier:** 15GB total storage across all Google accounts
- **Your Product Images:** ~81,000 × 300KB = ~24GB
- **Upgrade Needed:** $2/month for 100GB or $10/month for 2TB

### Cost Breakdown
| Plan | Cost | Storage |
|------|------|---------|
| Free | $0 | 15 GB |
| Google One Basic | $1.99/mo | 100 GB |
| Google One Standard | $9.99/mo | 2 TB |
| Google One Premium | $19.99/mo | 2 TB |

**Recommendation:** Start with free tier. When you exceed 15GB, upgrade to Standard ($9.99/mo).

---

## 🚀 Advanced: Folder ID Management

If you already have folders set up on Google Drive, you can use their IDs directly:

```javascript
// Optional: Use existing folder IDs for faster setup
const folderIds = {
  'ammunition': 'folder-id-here',
  'guns': 'folder-id-here',
  // ...
};
```

Then in google-drive-upload.js, you could modify the setupFolders method to use these IDs if they exist.

---

## ✅ Verification Checklist

- [ ] Admin server running at http://localhost:3001
- [ ] Admin dashboard loads at http://localhost:3001/admin.html
- [ ] Can login with admin/modulargunworks2024
- [ ] Google Drive folders visible in your Google Drive
- [ ] CSV import test works
- [ ] Image upload test works
- [ ] Changed default admin password
- [ ] Folder names customized if needed
- [ ] .gitignore includes google-credentials.json

---

## 📝 System Architecture

```
┌─────────────────────────────────────────┐
│      Admin Browser (admin.html)         │
│  • Dashboard, CSV upload, Image upload  │
└──────────────┬──────────────────────────┘
               │ HTTP Requests
               ↓
┌─────────────────────────────────────────┐
│      Node.js Express Server (admin.js)  │
│  • Authentication, CSV parsing, Routes  │
└──────────────┬──────────────────────────┘
               │ Google API Calls
               ↓
┌─────────────────────────────────────────┐
│    Google Drive (Service Account)       │
│  • Product Images stored in folders     │
│  • Automatic backup & organization      │
└─────────────────────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────┐
│      JSON Data Files (Data/*.json)      │
│  • Products with image URLs             │
│  • Updates from CSV imports             │
└─────────────────────────────────────────┘
```

---

## 🔗 API Endpoints

All endpoints require login (session-based):

```
POST   /api/auth/login               - Login (username/password)
POST   /api/auth/logout              - Logout
GET    /api/auth/status              - Check if authenticated

POST   /api/import/csv               - Upload & preview CSV
POST   /api/import/confirm           - Confirm import

POST   /api/images/upload            - Single image to Google Drive
POST   /api/images/bulk-upload       - Bulk ZIP upload

GET    /api/products                 - List all products by category
GET    /api/products/search          - Search products

GET    /api/dashboard/stats          - Get inventory stats
```

---

## 🆘 Troubleshooting

**Issue:** Folders not created on first run
- **Fix:** Make sure service account has access to Google Drive
- Check: `google-credentials.json` is valid

**Issue:** Can't upload images
- **Fix:** Check if Google Drive folders were created
- Verify: Service account has edit permissions

**Issue:** Images uploaded but no URL returned
- **Fix:** Check if `makePublic: true` in config (for public images)
- Or: Use internal Google Drive links if private

**Issue:** Wrong folder names appear in Google Drive
- **Fix:** Restart server to recreate with new names
- Delete old folders from Google Drive first

---

## 📞 Support

For issues with:
- **Google API:** See [googleapis documentation](https://github.com/googleapis/google-api-nodejs-client)
- **Admin features:** Check admin.js comments
- **Google Drive:** See [Google Drive Help](https://support.google.com/drive)

