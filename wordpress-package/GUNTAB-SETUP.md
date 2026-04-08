# GunTab Payment Setup (Firearms & Ammunition Compliant)

GunTab is the payment platform designed for firearm and ammunition e-commerce. It is **required** for compliant processing of firearms and ammo sales (PayPal, Stripe, and most processors prohibit these). This guide ensures your cart, checkout, and GunTab integration work correctly.

## Prerequisites

- WordPress with WooCommerce activated
- Modular Gunworks theme active
- Cart and Checkout pages set in **WooCommerce → Settings → Advanced → Page setup**

---

## 1. Install & Activate GunTab

1. Go to **Plugins → Add New**
2. Search for **"GunTab Payment Gateway"**
3. Click **Install Now**, then **Activate**
4. Or download from [WordPress.org](https://wordpress.org/plugins/guntab-payment-gateway/)

---

## 2. Configure GunTab in WooCommerce

1. Go to **WooCommerce → Settings → Payments**
2. Find **GunTab Payments**
3. Click **Manage** (or **Set up**)
4. Configure:

   | Setting | Value |
   |---------|-------|
   | **Enable GunTab Gateway** | Checked |
   | **Title** | Pay with GunTab (or keep default) |
   | **Test mode** | Check for testing, uncheck for live |
   | **Test API token** | From your GunTab test account |
   | **Production API token** | From your GunTab production account |
   | **Show quick checkout buttons on product pages** | Unchecked (theme hides these; checkout via cart is preferred) |

5. Click **Save changes**
6. Ensure **GunTab Payments** is **enabled** (toggle on) in the Payments list

---

## 3. Get GunTab API Credentials

1. Sign up or log in at [GunTab.com](https://www.guntab.com)
2. Go to **Account → Webhooks** (or API/Developer section)
3. Create an API token for your site
4. Copy the **Production** token for live sales
5. Copy the **Test** token if you have test mode
6. Paste into WooCommerce → Settings → Payments → GunTab → Manage

---

## 4. Configure GunTab Webhook

GunTab sends order status updates to your site. The plugin registers a webhook URL.

1. In your GunTab account, go to **Webhooks** / **Endpoints**
2. Add your webhook URL. The GunTab plugin shows it in:
   - **WooCommerce → Settings → Payments → GunTab → Manage** (see "Production API token" description)
   - Typically: `https://yoursite.com/?rest_route=/guntab/v1/webhook` or similar
3. Save in GunTab dashboard
4. Test that GunTab can reach your site (HTTPS required for production)

---

## 5. Verify Cart & Checkout Flow

### Cart Page

1. Go to **WooCommerce → Settings → Advanced → Page setup**
2. Ensure **Cart page** is set (e.g. "Cart" ID: 7)
3. Visit your Cart page: `https://yoursite.com/cart/`
4. You should see:
   - Cart items (or "Your cart is currently empty")
   - **Proceed to Checkout** button
   - Age verification checkboxes (when cart has ammo/firearms)

If the cart page shows only "CART" with nothing else:

1. **Quick fix:** In WP Admin, look for the yellow notice: **"Fix Cart & Checkout Pages"** — click it
2. **Or:** **WooCommerce → Settings → Advanced → Page setup** — visit that page; the theme will auto-fix on first admin visit
3. **Or:** **Pages → Cart** — edit the page, set content to `[woocommerce_cart]`, save
4. **Or:** **Appearance → Themes** — switch to another theme and back to Modular Gunworks

### Checkout Page

1. Add a product to the cart, then click **Proceed to Checkout**
2. On the Checkout page you should see:
   - **GunTab Payments** (or "Pay with GunTab") as a payment option
   - Billing and shipping fields
   - FFL notice (if order contains firearms)
   - State compliance notice

3. Select **Pay with GunTab** and place order
4. You should be redirected to GunTab.com to complete payment

---

## 6. Theme Behavior (Firearms & Ammunition)

The Modular Gunworks theme automatically:

- **Cart:** Requires age verification (21+, state restrictions) before **Proceed to Checkout** when cart contains ammunition or firearms
- **Checkout:** Shows FFL notice when order contains firearms; state compliance notice for all orders
- **Product pages:** Hides the "Pay with GunTab" quick-checkout button (users add to cart, then checkout with GunTab at the checkout page—preferred flow)
- **Single payment method:** GunTab should be your primary/only payment method for firearms and ammunition compliance

---

## 7. Troubleshooting

| Issue | Fix |
|-------|-----|
| Cart page shows only "CART" | Ensure Cart page has `[woocommerce_cart]` in content; re-save theme or edit page manually |
| GunTab not visible at checkout | Enable GunTab in WooCommerce → Settings → Payments; add valid API token |
| Webhook errors | Ensure site uses HTTPS; verify webhook URL in GunTab dashboard |
| "crypto.randomUUID" error | Theme includes a polyfill; ensure theme is up to date |
| Age verification blocks checkout | User must check all required boxes (21+, state ack, FFL ack for firearms) |

---

## 8. SSL / HTTPS

For production:

- **WooCommerce → Settings → Advanced**: Enable **Force secure checkout** so checkout runs over HTTPS
- GunTab and most payment flows require HTTPS in production

---

## Summary Checklist

- [ ] GunTab Payment Gateway plugin installed and activated
- [ ] GunTab enabled in WooCommerce → Settings → Payments
- [ ] Production (and optionally Test) API token added
- [ ] Webhook URL configured in GunTab account
- [ ] Cart page set in WooCommerce Page setup
- [ ] Checkout page set in WooCommerce Page setup
- [ ] Cart page displays items and "Proceed to Checkout"
- [ ] Checkout shows "Pay with GunTab" as payment option
- [ ] Test order completes and redirects to GunTab
- [ ] SSL/HTTPS enabled for checkout (production)
