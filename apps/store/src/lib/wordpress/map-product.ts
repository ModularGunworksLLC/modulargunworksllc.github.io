import type { StoreProduct } from "@/lib/catalog/types";
import type { WcStoreProduct } from "./types";

function minorToMajor(amount: string, minorUnit = 2): number | null {
  const n = parseInt(amount, 10);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n / 10 ** minorUnit;
}

/** Map WooCommerce Store API product → storefront shape (already Chattanooga-synced on WP). */
export function mapWcProductToStore(p: WcStoreProduct): StoreProduct {
  const minor = p.prices?.currency_minor_unit ?? 2;
  const listPrice = minorToMajor(p.prices?.price || "", minor);
  const regularPrice = minorToMajor(p.prices?.regular_price || "", minor);
  const top = p.categories?.[0];
  const topSlug = top?.slug || "";
  const sub = p.categories?.[1];
  const imageUrl = p.images?.[0]?.src || "";
  const inStock = Boolean(p.is_in_stock);

  return {
    sku: (p.sku || "").trim() || String(p.id),
    name: p.name || "",
    description: p.short_description || p.description || "",
    brand: p.brands?.[0]?.name || top?.name || "",
    upc: "",
    listPrice,
    dealerPrice: null,
    msrp: regularPrice,
    map: listPrice,
    stock: inStock ? 1 : 0,
    imageUrl,
    vendorCategoryKey: top?.name || "",
    topCategory: top?.name || "",
    topSlug,
    subCategory: sub?.name || null,
    subSlug: sub?.slug || null,
    sellable: Boolean(listPrice && listPrice > 0 && imageUrl && p.is_purchasable !== false),
    attributes: {},
    excludedReason: !imageUrl ? "no_image" : !listPrice ? "no_price" : undefined,
  };
}

export type WcProductCard = StoreProduct & {
  slug: string;
  permalink: string;
  inStock: boolean;
  onSale: boolean;
};

export function mapWcProductToCard(p: WcStoreProduct): WcProductCard {
  const base = mapWcProductToStore(p);
  return {
    ...base,
    slug: p.slug,
    permalink: p.permalink,
    inStock: Boolean(p.is_in_stock),
    onSale: Boolean(p.on_sale),
  };
}
