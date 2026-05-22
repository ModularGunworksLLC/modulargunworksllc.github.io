import categoryMapping from "@/data/chattanooga/category-mapping.json";
import type { StoreProduct } from "@/lib/catalog/types";
import { subToSlug, topToSlug } from "@/lib/chattanooga/category-slugs";
import { normalizeVendorRow } from "@/lib/chattanooga/normalize";
import {
  isNfaVendorCategory,
  parseDealerPrice,
  resolveListingPrice,
  resolveValidImageUrl,
} from "@/lib/chattanooga/rules";

const CATEGORY_MAP = categoryMapping as Record<
  string,
  { top: string; sub: string }
>;

const FILTER_ATTR_KEYS = [
  "caliber",
  "bullet_type",
  "grain",
  "round_count",
  "capacity",
  "gauge",
  "velocity",
  "shot_size",
  "casing",
  "product_line",
  "style",
] as const;

/** Map one CSV row → StoreProduct using the same rules as mgw-chattanooga-sync. */
export function mapRowToStoreProduct(row: Record<string, string>): StoreProduct {
  const n = normalizeVendorRow(row);
  const sku = (n.sku || row.SKU || row["Item Number"] || "").trim();
  const catKey = (n.category_key || row.Category || "").trim();

  if (isNfaVendorCategory(catKey)) {
    return emptyProduct(sku, catKey, "nfa_restricted");
  }

  const map = CATEGORY_MAP[catKey];
  const topCategory = map?.top ?? "New Arrivals";
  const topSlug = topToSlug(topCategory);
  const subCategory = map?.sub ?? null;
  const subSlug = subCategory ? subToSlug(topCategory, subCategory) : null;

  const listPrice = resolveListingPrice(n, row);
  const imageUrl = resolveValidImageUrl(n, row);
  const stock = parseInt(n.stock || row["Quantity In Stock"] || "0", 10) || 0;

  let excludedReason: string | undefined;
  if (listPrice === null || listPrice <= 0) excludedReason = "no_list_price";
  else if (!imageUrl) excludedReason = "no_image";

  const sellable = !excludedReason;

  const attributes: Record<string, string> = {};
  for (const k of FILTER_ATTR_KEYS) {
    if (n[k]) attributes[k] = n[k];
  }

  return {
    sku,
    name: n.name || row["Web Item Name"] || row["Item Name"] || row.Description || "No Name",
    description: n.description || row["Web Item Description"] || "",
    brand: n.brand || row.Manufacturer || "",
    upc: n.upc || row.UPC || "",
    listPrice,
    dealerPrice: parseDealerPrice(n, row),
    msrp: parseFloat(n.msrp || row.MSRP || "") || null,
    map: parseFloat(n.map || row.MAP || "") || null,
    stock,
    imageUrl,
    vendorCategoryKey: catKey,
    topCategory,
    topSlug,
    subCategory,
    subSlug,
    sellable,
    excludedReason,
    attributes,
  };
}

function emptyProduct(sku: string, catKey: string, reason: string): StoreProduct {
  return {
    sku,
    name: "",
    description: "",
    brand: "",
    upc: "",
    listPrice: null,
    dealerPrice: null,
    msrp: null,
    map: null,
    stock: 0,
    imageUrl: "",
    vendorCategoryKey: catKey,
    topCategory: "",
    topSlug: "",
    subCategory: null,
    subSlug: null,
    sellable: false,
    excludedReason: reason,
    attributes: {},
  };
}
