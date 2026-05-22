import { wcStoreApiUrl } from "./config";
import { mapWcProductToCard, type WcProductCard } from "./map-product";
import type { WcStoreProduct } from "./types";

export type WordPressCatalogQuery = {
  category?: string;
  search?: string;
  page?: number;
  perPage?: number;
};

export type WordPressCatalogResult = {
  products: WcProductCard[];
  total: number;
  totalPages: number;
  page: number;
  source: "wordpress";
};

const DEFAULT_REVALIDATE = 300;

export async function fetchWordPressProducts(
  query: WordPressCatalogQuery = {},
): Promise<WordPressCatalogResult> {
  const perPage = Math.min(Math.max(query.perPage ?? 48, 1), 100);
  const page = Math.max(query.page ?? 1, 1);
  const params = new URLSearchParams({
    per_page: String(perPage),
    page: String(page),
  });
  if (query.category) params.set("category", query.category);
  if (query.search) params.set("search", query.search);

  const url = `${wcStoreApiUrl("/products")}?${params}`;
  const res = await fetch(url, {
    next: { revalidate: DEFAULT_REVALIDATE },
  });

  if (!res.ok) {
    throw new Error(`WordPress catalog HTTP ${res.status}`);
  }

  const raw = (await res.json()) as WcStoreProduct[];
  const total = parseInt(res.headers.get("x-wp-total") || "0", 10) || raw.length;
  const totalPages =
    parseInt(res.headers.get("x-wp-totalpages") || "1", 10) || 1;

  return {
    products: raw.map(mapWcProductToCard),
    total,
    totalPages,
    page,
    source: "wordpress",
  };
}

export async function fetchWordPressProductBySlug(
  slug: string,
): Promise<WcProductCard | null> {
  const params = new URLSearchParams({ slug });
  const url = `${wcStoreApiUrl("/products")}?${params}`;
  const res = await fetch(url, { next: { revalidate: DEFAULT_REVALIDATE } });
  if (!res.ok) return null;
  const raw = (await res.json()) as WcStoreProduct[];
  if (!raw.length) return null;
  return mapWcProductToCard(raw[0]);
}
