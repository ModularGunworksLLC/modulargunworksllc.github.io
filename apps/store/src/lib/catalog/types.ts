/** Storefront product — aligned with WooCommerce + mgw-chattanooga-sync rules. */
export type StoreProduct = {
  sku: string;
  name: string;
  description: string;
  brand: string;
  upc: string;
  /** Customer-facing price (MSRP, else MAP). Never dealer CSV Price. */
  listPrice: number | null;
  dealerPrice: number | null;
  msrp: number | null;
  map: number | null;
  stock: number;
  imageUrl: string;
  /** Raw Chattanooga Category column */
  vendorCategoryKey: string;
  /** From category-mapping.json */
  topCategory: string;
  topSlug: string;
  subCategory: string | null;
  subSlug: string | null;
  sellable: boolean;
  excludedReason?: string;
  /** Filter attributes (ammo, etc.) — same keys as WP sync meta */
  attributes: Record<string, string>;
};

export type CatalogSyncStats = {
  fetchedAt: string;
  totalRows: number;
  mapped: number;
  sellable: number;
  unmappedCategory: number;
  nfaExcluded: number;
  noPrice: number;
  noImage: number;
  byTopCategory: Record<string, number>;
};
