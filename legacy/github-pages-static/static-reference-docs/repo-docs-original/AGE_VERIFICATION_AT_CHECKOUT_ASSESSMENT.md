# Assessment: Age Gate Lowered/Removed + Age Verification at Checkout Only

**Request:** Lower the site-wide age gate to 18 or remove it so users can browse and buy non–age-restricted items freely. For items that by law require an age restriction, require age verification (e.g. birthdate) at checkout only, and track that verification somehow.

**Status:** Assessment only. No code or behavior has been changed.

---

## 1. Legal Feasibility

### Federal law (Gun Control Act)

- **No federal requirement for a site-wide age gate.** The law only says licensees may not sell to underage buyers and must not “know or have reasonable cause to believe” the buyer is underage.
- **Verifying age at point of sale (checkout)** is a valid and common approach. Requiring birthdate (and optionally storing that the customer attested/verified) at checkout for age-restricted items supports compliance.
- **Ages that matter at sale:**
  - **18+:** Rifles, shotguns, and ammunition for rifles/shotguns.
  - **21+:** Handguns and all other ammunition (e.g. handgun ammo).

**Conclusion:** It is legally feasible to remove or lower the site-wide gate and to require age verification only when the customer is buying age-restricted items, at checkout.

---

## 2. What Must Be Age-Restricted vs Not

| Product type | Federal minimum age at sale | Typical categories on your site |
|-------------|-----------------------------|----------------------------------|
| Rifle/shotgun ammo | 18 | Ammunition (rifle/shotgun) |
| Handgun / “other” ammo | 21 | Ammunition (handgun) |
| Firearms (FFL) | 18 or 21 by type | Not sold online by you currently |
| Magazines, gun parts, optics, gear, reloading, outdoors | No federal age minimum for the product itself | Magazines, Gun Parts, Optics, Gear, Reloading, Outdoors |

So in practice:

- **Ammunition** is the main category where you must enforce age at sale (18 vs 21 depending on rifle/shotgun vs handgun).
- **Other categories** (magazines, gun parts, optics, gear, reloading, outdoors) do not have a federal age minimum for the product; users could buy those with no age check if you choose.
- You can still apply a **policy** (e.g. “we only sell to 18+”) and enforce that at checkout for ammo only, or for ammo + any other items you decide to treat as age-restricted.

**Conclusion:** You can allow browsing and buying of non–age-restricted items with no gate. For items that “by law” require an age restriction, limiting that to **ammunition** (and any future FFL items) and enforcing age only at checkout is consistent with federal law.

---

## 3. Technical Feasibility

### 3.1 Product-level age rules

- Today, products have **category** (and subcategory) but no **minAge** or **ageRestricted** flag.
- To “depend on the item,” you need a rule per product or per category:
  - **Option A (category-based):** e.g. “Ammunition” = 21 (conservative) or 18/21 by subcategory (rifle vs handgun ammo). No change to product JSON if you derive from category.
  - **Option B (product-level):** Add something like `minAge: 18 | 21` or `ageRestricted: true` and optional `minAge` in your product data (e.g. in `load-products.js` normalizer and/or in the JSON). Requires a rule for ammo (e.g. by caliber/subcategory: handgun vs rifle/shotgun).
- **Recommendation:** Start with **category-based** (e.g. Ammunition = 21, or Ammunition + subcategory for 18 vs 21). Product-level is more accurate but needs data/rules (e.g. handgun vs rifle ammo).

### 3.2 Cart

- Cart items today: `sku`, `name`, `price`, `quantity`, `image`, `category`, `addedAt`. No age field.
- To know “does this cart need age verification?” you can either:
  - **Store** a `minAge` (or `ageRestricted`) per line when adding to cart (from product/category rule), or
  - **Compute at checkout:** when rendering cart or when user clicks “Pay,” look up each item’s category (and optionally product) and apply your rule. No cart schema change required if you have category and a small lookup (e.g. “ammunition” → 21).
- **Conclusion:** Doable with or without changing cart item shape; computing from `category` at checkout is the smallest change.

### 3.3 Checkout flow

- Checkout today: cart page shows items and a PayPal button; `createOrder` builds the order and user pays.
- **Required change:** Before PayPal `createOrder` (or before enabling the PayPal button):
  1. Check if the cart contains any age-restricted item (using category/product rules above).
  2. If **no** restricted items → allow checkout as now (no birthdate).
  3. If **yes** restricted items → show an age-verification step: e.g. “Your cart contains ammunition. You must be 21 (or 18 for rifle/shotgun ammo only) to purchase. Enter your date of birth.” Collect birthdate (and optionally confirm “I am 21+” or “I am 18+”), validate that age meets the required minimum for the items in the cart, then enable PayPal and allow checkout.
- **Conclusion:** Fully doable in the existing cart/checkout page with one conditional step and a small amount of UI (form + validation).

### 3.4 “Track this somehow”

- **Options:**
  - **With order (recommended):** When you send the order to your backend/email (e.g. after `onApprove`), include a flag like `ageVerified: true` and, if you store it, `dateOfBirth: YYYY-MM-DD` or `ageVerifiedAt: <timestamp>`. That gives you a record per order that age was verified for that purchase.
  - **Backend/DB:** If you add a simple orders table or order log, store the same there.
  - **Local only:** Store in `localStorage` that “this session verified age” so you don’t ask again on the same cart page; this does **not** give you a durable record unless you also send it with the order.
- **Privacy:** Storing full date of birth (DOB) has higher privacy impact. Storing only “age verified at checkout: yes + date/time” (and optionally “met 21+” or “met 18+”) is often enough for compliance and reduces liability. If you do store DOB, treat it as sensitive (access control, retention, disclosure in privacy policy).
- **Conclusion:** Tracking is doable: at minimum, send “age verified” (and required min age met) with the order and keep it in your order records; optionally store DOB only if you need it and handle it carefully.

---

## 4. What We Can Do (Summary)

| Option | Description |
|--------|-------------|
| **1. Remove site-wide age gate** | No popup on entry. Everyone can browse and add non–age-restricted items to cart and checkout without any age step. |
| **2. Lower site-wide gate to 18** | One click “I am 18+” at first visit. Fewer items are “restricted” by the gate; you still need item-level logic at checkout for ammo (18 vs 21). |
| **3. Checkout-only verification** | No gate (or optional 18+ gate). At checkout, if cart contains ammunition (or any item you mark age-restricted), require birthdate (and optionally confirmation), validate age, then allow payment. |
| **4. Track verification** | With each order that included age-restricted items, record that age was verified (and optionally DOB or “met 21+” / “met 18+”) in the order payload and/or backend so you have an audit trail. |

You can combine these: e.g. **remove gate + checkout-only verification for ammo + track per order**.

---

## 5. What We’d Need (Implementation Outline)

- **Data/rules:** A single place (e.g. in `load-products.js` or a small config) that defines which categories (or products) are age-restricted and at what minimum age (18 or 21). Ammunition is the main one; 21 for all ammo is the simplest; 18 for rifle/shotgun and 21 for handgun is more precise but needs ammo subcategory or product type.
- **Cart/checkout:** A function “cartRequiresAgeVerification(cart)” that returns e.g. `{ required: true, minAge: 21 }` or `{ required: false }`. Use it on the cart page before showing or enabling PayPal.
- **Checkout UI:** A small form or modal: “Your cart contains items that require you to be [18/21]+. Enter your date of birth.” Plus validation (e.g. must be 18 or 21 by today’s date). On success, set a flag (e.g. `window.ageVerifiedForCheckout = true` or store in session) and then run PayPal `createOrder`.
- **Order payload:** When sending the order (e.g. to your email/backend), add fields such as `ageVerified: true`, `minAgeRequired: 21`, and optionally `dateOfBirth` or `ageVerifiedAt`.
- **Optional:** If you ever need to show “this product requires 18+ or 21+” on the product or cart line, add `minAge` (or similar) to the product model and/or cart item and display it (e.g. small badge).

No changes to your current site have been made; this is the list of what would be needed to implement the above.

---

## 6. Risks and Considerations

- **State law:** Some states set a higher minimum age (e.g. 21 for all ammo) or require in-person/ID for ammo. Your checkout flow doesn’t change that; you still must refuse to ship to states where the sale would be illegal and, if you add state-by-state logic, you could require a higher min age (e.g. 21) for certain states.
- **“Reasonable cause to believe”:** Collecting and validating birthdate at checkout is stronger than a single click-through and helps show you did not have reason to believe the buyer was underage.
- **Privacy:** If you store DOB, say so in your privacy policy and keep the data secure and minimal; prefer storing “age verified + min age met” instead of DOB where possible.
- **UX:** Users buying only gear/optics/mags etc. get no age step; users buying ammo get one extra step at checkout, which is a common pattern.

---

## 7. Conclusion

- **Legal:** Yes — you can lower or remove the site-wide age gate and rely on age verification at checkout for items that by law require it (mainly ammunition).
- **Technical:** Yes — category-based (or product-based) rules, cart check at checkout, birthdate form + validation, and sending “age verified” (and optional DOB) with the order are all feasible with your current stack.
- **Tracking:** Yes — include age-verification result (and optionally DOB) in the order record and/or backend so you have a per-order audit trail.

No code or behavior has been changed in this assessment. When you want to proceed, implementation can follow the outline in Section 5.
