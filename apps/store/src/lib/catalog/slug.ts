/** URL slug for /shop/product/[slug] — stable from SKU (Chattanooga source of truth). */
export function slugFromSku(sku: string): string {
  const s = sku
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || "product";
}
