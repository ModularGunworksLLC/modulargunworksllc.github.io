# Admin Product Management System

## Overview

Your new admin panel lets you control which products appear on your live website and manage their categories in real-time.

## How It Works

### 1. **Admin Panel** (`/admin.html`)
- Login with password to access the backend
- Search & filter through all 48,000 products from Chattanooga API
- Click "Activate" to add products to your live pages
- Select which page/category each product should appear on
- Remove products whenever you want

### 2. **Active Products File** (`data/products/active.json`)
- Stores your selections
- Only products in this file will appear on your live site
- Automatically managed by the admin panel (don't edit manually)

### 3. **Daily API Sync** (Run: `sync-chattanooga-api.js`)
```bash
npm run sync
# Or manually:
$env:API_SID="YOUR_SID"; $env:API_TOKEN="YOUR_TOKEN"; node scripts/sync-chattanooga-api.js
```

**What happens:**
- ✅ Fetches latest data from Chattanooga API (48K products)
- ✅ Checks your `active.json` file
- ✅ Only includes products you've activated
- ✅ Updates pricing, stock, and availability in real-time
- ✅ Your product selections persist across syncs

### 4. **Real-Time Updates on Live Site**
```
Example: You activate "Federal 9MM" on ammunition page
   ↓
   Every 15 minutes, your sync script runs
   ↓
   Chattanooga changes price from $9.99 → $8.99
   ↓
   Your ammunition.json gets updated
   ↓
   Website shows $8.99 (NO MANUAL ACTION NEEDED!)
```

---

## Setup Instructions

### Step 1: Change the Admin Password

**Edit** `scripts/admin-api.js` line 11:
```javascript
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'gunworks2024'; // ← Change this!
```

Or set environment variable:
```bash
$env:ADMIN_PASSWORD = "your-new-password"
node scripts/admin-api.js
```

### Step 2: Start the Admin API Server

**In a terminal, run:**
```bash
node scripts/admin-api.js
```

You'll see:
```
✓ Admin API running on http://localhost:3001
✓ Open admin panel: http://localhost:3001/../admin.html
```

### Step 3: Open Admin Panel

Go to: **http://localhost:3001/../admin.html**

(Or navigate to: `http://localhost:3001` then open `admin.html`)

### Step 4: Login

Enter your admin password from Step 1

### Step 5: Start Activating Products

1. **Search** for products (e.g., "Federal 9MM")
2. **Filter** by brand, category, price, stock
3. **Click** "Activate" button
4. **Select page** (Ammunition, Optics, etc.)
5. **Product appears** in right sidebar = Success!

---

## Running Both Servers (Admin + Web)

You can run **both your web server and admin API** at the same time:

**Terminal 1 - Web Server:**
```bash
node serve.js
```

**Terminal 2 - Admin API:**
```bash
node scripts/admin-api.js
```

Or create a batch file (`start-both.bat`):
```batch
@echo off
start cmd /k "cd /d %cd% && node serve.js"
start cmd /k "cd /d %cd% && node scripts/admin-api.js"
pause
```

---

## Daily Automation (Optional)

### Windows Task Scheduler

To sync products every day at 2 AM:

1. Open **Task Scheduler**
2. Create Basic Task
3. Set trigger: "Daily" at 2:00 AM
4. Action: `Start a program`
   - Program: `C:\nodejs\node.exe` (your Node path)
   - Arguments: `scripts\sync-chattanooga-api.js`
   - Start in: `C:\path\to\your\site`
   - Set environment variables in script

### Using Node.js Scheduler

Or add to `scripts/scheduler.js` for automatic syncing while app runs.

---

## File Structure

```
├── admin.html                          # Admin panel UI
├── data/
│   └── products/
│       ├── active.json                 # Your product selections (managed by admin)
│       ├── ammunition.json             # Generated from API (do not edit)
│       ├── optics.json                 # Generated from API (do not edit)
│       └── ...other categories
├── scripts/
│   ├── admin-api.js                    # Admin backend server
│   └── sync-chattanooga-api.js         # API sync (respects active.json)
└── serve.js                            # Your main web server
```

---

## Typical Workflow

**Day 1: Initial Setup**
```
1. Open admin panel
2. Search for products: "9MM ammunition"
3. Click "Activate" on each one you want
4. Select "Ammunition" page
5. (Repeat for Optics, Magazines, etc.)
6. Run sync script
7. Your live site now shows selected products!
```

**Day 2-30: Just Use It**
```
1. Prices change automatically every sync
2. Stock updates automatically
3. You can activate/deactivate anytime
4. Changes take effect after next sync
```

**Need to adjust?**
```
1. Login to admin
2. Remove product → "Remove" button in right sidebar
3. Or add new → Click "Activate"
4. Next sync = live on website
```

---

## API Endpoints (For Reference)

All endpoints require `Authorization: Bearer {token}` header

```bash
# Authentication
POST /api/admin/auth
  Body: { password: "gunworks2024" }
  Response: { token: "..." }

# Search Products
GET /api/admin/search?q=9MM&brand=Federal&limit=50

# Get Active Products
GET /api/admin/active
GET /api/admin/active/ammunition  # For specific page

# Activate Product
POST /api/admin/activate
  Body: { productId: "123", page: "ammunition" }

# Deactivate Product  
POST /api/admin/deactivate
  Body: { productId: "123" }

# Stats
GET /api/admin/stats
```

---

## Troubleshooting

### "Connection error" in admin panel
- Check if admin-api.js is running
- Make sure port 3001 is not blocked
- Try: `http://localhost:3001/api/admin/health`

### Products not appearing on live site
- Check that products are in `active.json`
- Run sync script again
- Verify products are in category JSON files

### Lost admin access
- Restart `admin-api.js` to clear tokens
- You'll need to login again

### Sync seems slow
- First sync fetches 48K products (can take 2-5 mins)
- Subsequent syncs are much faster
- Check console output for progress

---

## Security Notes

⚠️ **Important:**
- Change default password immediately!
- Admin panel is localhost-only by design
- Don't expose port 3001 publicly
- If you need remote access, use VPN/SSH tunnel
- Tokens expire after 8 hours
- All changes logged to `active.json` timestamps

---

## Questions?

The system works like this:
1. **You choose** which products appear (via admin panel)
2. **API provides** current prices and stock
3. **Sync merges** them together every day
4. **Your site** always shows fresh data

You stay in control. Chattanooga stays current. Everyone wins!
