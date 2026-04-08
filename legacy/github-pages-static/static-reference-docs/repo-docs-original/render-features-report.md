# Render.com Free Tier – Site Features Report

**Modular Gunworks LLC**  
Report: options for mailing list, promos, and member signups on Render free tier.

---

## What You Can Do (Free Tier)

| Feature | Possible? | How |
|--------|-----------|-----|
| **Mailing list** | Yes | Backend + Supabase (store emails); optional Resend/Brevo for sending (free tiers) |
| **Promo bar / promos** | Yes | Static bar + optional backend for promo codes |
| **Member signups** | Yes | Backend + Supabase (or Supabase Auth) |
| **Member-only discounts** | Yes | Backend returns discount when user is logged in; cart applies it |
| **Track sales by member** | Yes | Store member ID with orders when you add checkout/webhook |

---

## Suggested Build Order

1. **Mailing list** – Signup form → save First Name + Email in your DB (Supabase); optionally send “Thanks for signing up” via Resend or Brevo (free tiers).
2. **Promo bar** – Static “Free shipping over $99” / “10% off with code X” at top of site.
3. **Member signup + login** – Create account, store in DB (or use Supabase Auth).
4. **Member-only discount** – Logged-in members see member price or auto-applied discount in cart.
5. **Promo codes** – Checkout field; backend validates codes (e.g. JULY4, MEMBER10).

---

## Tech Stack (Free Where Possible)

- **Render** – 1 free Web Service (small Node or Python API).
- **Supabase** – Free Postgres + optional Auth for members and emails.
- **Email / mailing list** – see cost notes below.

Current site can stay static (e.g. GitHub Pages); frontend calls your Render API at `https://your-app.onrender.com/api/...`.

---

## Email / Mailing List – Cost Reality

**Mailchimp** – Has a **free tier** but it’s limited: **250 contacts**, 500 sends/month. Above that it’s paid (often ~$13–20+/month). Fine to start; you’ll outgrow it if the list grows.

**Truly free or very cheap options:**

| Option | Cost | Notes |
|--------|------|--------|
| **Store in your own DB only** | $0 | Save First Name + Email in Supabase. You send newsletters yourself (e.g. BCC from Gmail, or export CSV and use a one-off tool). No automated “welcome” email unless you add a sender. |
| **Resend** | Free tier: 3,000 emails/month | Good for transactional (welcome, receipts). Can also do small newsletters. |
| **Brevo** (formerly Sendinblue) | Free: 300 emails/day | Newsletter + automation; free tier is generous for small lists. |
| **Mailchimp** | Free: 250 contacts, 500 sends/mo | After that, paid. |

**Recommendation:** Start by **storing signups in your own DB (Supabase)**. That’s $0 and you own the list. Add a transactional sender (Resend or Brevo free tier) only when you want automated “Thanks for signing up” or member emails. Avoid depending on Mailchimp unless you’re okay paying once you pass 250 contacts.

---

## Decisions Needed Before Implementation

1. **Backend** – Add one small API on Render? (Yes recommended for list + members + codes.)
2. **First step** – Start with mailing list only, or mailing list + member signup?
3. **Auth** – Real login (email + password) vs. “member” = newsletter + one shared code.

---

## Implemented (static site)

- **Promo bar** – “Free shipping on orders over $99” added site-wide in the header promo bar.
- **Newsletter signup** – Footer block “Get deals & restock alerts” with First Name + Email on all main pages. Form `action="#"` for now; replace with your Formspree form ID or Render API endpoint when ready (see “Mailing list” above).
- **Product search** – Header search submits to `shop/search.html?q=...`. Search runs across all category JSONs (ammo, gear, optics, firearms, etc.) and shows the same product grid/list UI.

## Next Steps

- Choose: mailing list only vs. mailing list + members.
- If members: choose Supabase (or similar) and confirm you’re okay with a small Node/Python service on Render.
- Then: implement Phase 1 (mailing list form + API), then add promos and members in order above.
