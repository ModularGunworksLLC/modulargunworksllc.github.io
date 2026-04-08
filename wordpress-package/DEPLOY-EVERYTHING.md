# Deploy Everything – Cart, Checkout, GunTab, Crypto Fix

Do these steps **in order**. Your WordPress root is where `wp-config.php` lives.

---

## Step 1: Copy plugin folders

Copy these entire folders to `wp-content/plugins/`:

1. **mgw-crypto-polyfill/** – fixes `crypto.randomUUID` error  
   → `wp-content/plugins/mgw-crypto-polyfill/mgw-crypto-polyfill.php`

2. **mgw-force-cart-checkout/** – forces cart & checkout to always display  
   → `wp-content/plugins/mgw-force-cart-checkout/mgw-force-cart-checkout.php`  
   → `wp-content/plugins/mgw-force-cart-checkout/cart-checkout-template.php`

---

## Step 2: Copy & run the one-time fix script

1. Copy the file **`mgw-run-once-fix.php`** to your WordPress **root folder** (same level as `wp-config.php`).

2. **Log into WordPress** in your browser (wp-admin).

3. In a **new tab**, visit:
   ```
   https://YOUR-SITE.com/mgw-run-once-fix.php?key=mgw2024fix
   ```
   Replace `YOUR-SITE.com` with your actual domain.

4. You should see **"Fix complete"** and a list of what was updated.

5. **Delete** `mgw-run-once-fix.php` from your server.

---

## Step 3: Verify

1. **Cart:** Add a product → click Cart → you should see the cart and “Proceed to Checkout” (no crypto error).
2. **Checkout:** Click Proceed to Checkout → fill in details → choose **Pay with GunTab**.
3. **GunTab:** In WooCommerce → Settings → Payments, ensure GunTab is enabled and your API token is entered.

---

## What the fix script does

- Sets the Cart page content to `[woocommerce_cart]`
- Sets the Checkout page content to `[woocommerce_checkout]`
- Activates the MGW Crypto Polyfill plugin (fixes the `crypto.randomUUID` error)

**Important:** After running the fix script, go to **Plugins** and activate **MGW Force Cart & Checkout Display**. This ensures the cart and checkout render even if your theme or page template doesn’t output the content block.

---

## If something goes wrong

**"You must be logged in as admin"**  
Log into WordPress (wp-admin) first, then visit the fix URL.

**"MGW Crypto Polyfill plugin not found"**  
Make sure you uploaded the full `mgw-crypto-polyfill` folder to `wp-content/plugins/` before running the script. Then run the fix URL again.

**Cart still blank**  
1. Activate **MGW Force Cart & Checkout Display** (Plugins → Activate).  
2. If still blank: Edit the Cart page manually: Pages → Cart → set content to `[woocommerce_cart]` → Update.

**crypto.randomUUID error still appears**  
In Plugins, confirm **MGW Crypto randomUUID Polyfill** is activated. Clear your browser cache.
