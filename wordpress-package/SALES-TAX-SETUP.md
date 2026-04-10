# Sales Tax Setup – Modular Gunworks (Huntsville, AL)

> The **`mgw-sales-tax`** plugin was removed from `wordpress-package/plugins/`; this doc is general guidance only.

You have **physical nexus** in Huntsville, AL, so you must collect sales tax. This guide matches your obligations for 2026.

---

## Quick Reference

| Sale Type | Collect Tax? | Rate |
|-----------|--------------|------|
| **In-State (Alabama)** | Yes | Destination-based (customer's location) – see below |
| **Out-of-State** | Only if you hit that state's economic nexus | That state's rate |
| **Marketplace (Amazon, etc.)** | No – facilitator collects | N/A (report as exempt on AL filings) |

---

## 1. Alabama (In-State) Sales

Because you are in Huntsville, you **do not qualify** for the Simplified Sellers Use Tax (SSUT) program. SSUT is only for remote sellers (no physical presence in Alabama).

You must use **destination-based** rates (the rate where the buyer is located):

- **Huntsville customers**: ~9.0% combined (4% State + 4.5% City + 0.5% Madison County)
- **Other AL cities**: Different local rates; Alabama provides a [Local Cities and Counties Tax Rates file](https://www.revenue.alabama.gov/sales-use/local-cities-and-counties-tax-rates-text-file/)

**Options:**

1. **Single rate (simplest)**: Charge 9% for all Alabama orders. You may over- or under-collect.
2. **Zip-code rates (accurate)**: Add rates by ZIP using Alabama’s rate table.
3. **Tax plugin**: Use TaxJar, Avalara, or similar to auto-calculate destination rates.

The MGW Sales Tax plugin configures WooCommerce with a 9% Alabama default. You can adjust or add more rates in **WooCommerce → Settings → Tax → Standard rates**.

---

## 2. Out-of-State Sales

You only collect tax for another state if you meet its **economic nexus** (typically $100,000 in sales or 200 transactions per year in that state).

- Monitor sales by state.
- When you reach another state’s threshold, register there and add its rate in WooCommerce.
- A service like TaxJar can handle multi-state nexus for you.

---

## 3. Marketplace Sales

If you sell through Amazon, Etsy, eBay, etc., the **marketplace facilitator** collects and remits tax.

- You do not collect tax on those sales.
- You still report them as exempt or tax-paid on your Alabama filings so the state knows why you didn’t collect.

---

## 4. Tax-Exempt Sales

Some sales may be exempt (e.g., resale with a valid certificate, certain government/farm use). WooCommerce supports tax exemption via:

- **WooCommerce → Settings → Tax → Tax options** (tax exempt role, etc.)
- Tax exemption plugins if you need certificate validation

---

## 5. Reporting & Remittance

- File and pay Alabama sales tax with the [Alabama Department of Revenue](https://www.revenue.alabama.gov/).
- Use [My Alabama Taxes](https://myalabamataxes.alabama.gov/) for filing and payment.
- Keep records of collected tax and exempt sales for audits.

---

## Resources

- [Alabama DOR – Sales and Use Tax](https://www.revenue.alabama.gov/sales-use/)
- [Alabama SSUT Program](https://www.revenue.alabama.gov/sales-use/simplified-sellers-use-tax-ssut/) (remote sellers only)
- [Local Tax Rates File](https://www.revenue.alabama.gov/sales-use/local-cities-and-counties-tax-rates-text-file/)
