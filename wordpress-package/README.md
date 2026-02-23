# Modular Gunworks – WordPress Package for Lightsail

Package for migrating modulargunworksllc.github.io to AWS Lightsail WordPress.  
Includes theme, assets, product data, and deployment instructions.

---

## What's Included

| Folder/File | Purpose |
|-------------|---------|
| `modulargunworks/` | Custom WordPress theme (Modular Gunworks design) |
| `product-data/` | JSON product files for WooCommerce import |
| `CURSOR-LIGHTSAIL-SETUP.md` | **How to use Cursor AI with your Lightsail WordPress** |

---

## Quick Start – Deploy to Lightsail Tomorrow

### 1. Push to GitHub

**Option A – New repo** (recommended for clean Lightsail workflow):

1. Create a new repo on GitHub (e.g. `modulargunworks-wordpress`)
2. In the `wordpress-package` folder:

```bash
cd wordpress-package
git init
git add .
git commit -m "WordPress package for Lightsail migration"
git remote add origin https://github.com/YOUR_USERNAME/modulargunworks-wordpress.git
git push -u origin main
```

**Option B – Add to existing site repo:**

The `wordpress-package` folder lives inside your main site repo. You can push it as-is; on Lightsail you’ll clone and copy just the `modulargunworks` theme folder into `wp-content/themes/`.

### 2. Launch Lightsail WordPress

1. Go to [AWS Lightsail](https://lightsail.aws.amazon.com)
2. **Create instance** → Choose **WordPress** (one-click app)
3. Pick a plan (e.g. **$5/mo** – 1 GB RAM)
4. Create instance and wait for it to be ready
5. Click the instance → **Connect using SSH** (browser-based) or use your SSH key

### 3. Get WordPress Login

In the Lightsail console, your instance has a **WordPress** icon – click it for the one-click login URL. Or:

- In SSH: `cat /home/bitnami/bitnami_application_password` (Bitnami)  
- Or: `sudo cat /var/www/html/wp-config.php | grep table_prefix` then visit `http://YOUR_IP/wp-admin`

If using Bitnami:

- App URL: `http://YOUR_PUBLIC_IP`
- Username: `user`
- Password: see Bitnami docs / SSH output

### 4. Upload the Theme

**Option A – Zip and upload in WP Admin**

1. Zip the `modulargunworks` folder (Right-click → Send to → Compressed folder, or use 7-Zip)
2. Name the zip `modulargunworks.zip`
3. WP Admin → **Appearance** → **Themes** → **Add New** → **Upload Theme**
4. Choose the zip, install, activate

**Option B – Clone from GitHub on the server**

```bash
# SSH into Lightsail, then:
cd /var/www/html/wp-content/themes/   # or /opt/bitnami/wordpress/wp-content/themes/ on Bitnami
sudo git clone https://github.com/YOUR_USERNAME/modulargunworks-wordpress.git temp
sudo mv temp/modulargunworks ./
sudo chown -R www-data:www-data modulargunworks   # Use bitnami:daemon on Bitnami
sudo rm -rf temp
```

Then **Appearance → Themes** and activate **Modular Gunworks**.

### 5. Install WooCommerce

1. WP Admin → **Plugins** → **Add New**
2. Search **WooCommerce**, install, activate
3. Run the WooCommerce setup wizard

### 6. Point Your Domain (Namecheap)

1. In Namecheap: **Domain List** → your domain → **Manage** → **Advanced DNS**
2. Add an **A Record**:
   - Host: `@` (or `www` if you want www)
   - Value: `YOUR_LIGHTSAIL_PUBLIC_IP`
   - TTL: Automatic
3. In WordPress: **Settings** → **General**
   - **WordPress Address** and **Site Address**: `https://yourdomain.com` (or `https://www.yourdomain.com`)

### 7. Add GunTab

1. Search for a **GunTab** WooCommerce plugin in **Plugins → Add New**
2. Or follow GunTab’s docs for custom integration
3. Add your GunTab API credentials in the plugin or WooCommerce payment settings

### 8. Import Products

The `product-data/` folder has JSON files. WooCommerce imports CSV. You can:

- Use a JSON-to-CSV conversion script (Node or Python)
- Or use a plugin like **WP All Import** / **WooCommerce Product CSV Import** and convert JSON → CSV first

CSV columns needed: `SKU`, `Name`, `Price`, `Categories`, `Images` (URL), `Description`, `Stock`.

---

## Using Cursor AI with Lightsail WordPress

See **[CURSOR-LIGHTSAIL-SETUP.md](./CURSOR-LIGHTSAIL-SETUP.md)** for step-by-step instructions.

**Summary:** You can use Cursor (which you pay for) to edit your Lightsail WordPress site by:

1. **Remote SSH** – Connect Cursor to the Lightsail instance and edit files directly on the server
2. **Local clone + deploy** – Clone this repo locally, edit in Cursor, then deploy via SFTP/rsync/git pull on the server

---

## Theme Structure

```
modulargunworks/
├── style.css          # Theme metadata
├── functions.php      # Enqueue assets, WooCommerce support
├── header.php
├── footer.php
├── front-page.php     # Home page
├── index.php
└── assets/
    ├── css/           # Design system, layout, components
    ├── js/            # cart.js, age-gate.js
    └── images/        # Logo, category images
```

---

## Images Note

The header uses `Header-flagV2.png` as a background (in `layout.css`). Category carousel uses `ammunition.jpg`, `magazines.jpg`, `gear.jpg`, etc. in `assets/images/categories/`. If any are missing from your copy:

- Add `Header-flagV2.png` to `modulargunworks/assets/images/` for the header background
- Add category images to `modulargunworks/assets/images/categories/` (ammunition.jpg, magazines.jpg, gun-parts.jpg, gear.jpg, optics.jpg, reloading.jpg, outdoors.jpg, brands.jpg)

The site will still work without them; the header falls back to the gradient and category cards can use a placeholder.

---

## Checklist Before Go-Live

- [ ] Theme activated
- [ ] WooCommerce installed and configured
- [ ] Products imported
- [ ] GunTab (or payment gateway) configured
- [ ] Domain pointed (A record)
- [ ] SSL enabled (Lightsail load balancer or Let's Encrypt)
- [ ] Create pages: About, Contact, FAQ, Terms, Privacy, Order Status, etc.
- [ ] Test a purchase end-to-end

---

## Support

- **Lightsail**: [AWS Lightsail Docs](https://lightsail.aws.amazon.com/ls/docs/)
- **WordPress**: [WordPress.org](https://wordpress.org/support/)
- **WooCommerce**: [WooCommerce Docs](https://woocommerce.com/documentation/)
- **GunTab**: [guntab.com](https://guntab.com)
