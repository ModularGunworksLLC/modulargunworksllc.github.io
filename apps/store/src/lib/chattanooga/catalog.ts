import { parse } from "csv-parse/sync";
import type { CatalogSyncStats, StoreProduct } from "@/lib/catalog/types";
import { downloadProductFeedCsv } from "@/lib/chattanooga/client";
import { mapRowToStoreProduct } from "@/lib/chattanooga/map-row";

export type BuildCatalogOptions = {
  sid: string;
  token: string;
  /** Stop after N sellable products (0 = no limit) */
  maxSellable?: number;
  /** Only include this topSlug */
  topSlugFilter?: string;
};

export type BuildCatalogResult = {
  products: StoreProduct[];
  stats: CatalogSyncStats;
};

/** Pull full Chattanooga product-feed CSV and map rows like WordPress sync. */
export async function buildCatalogFromChattanooga(
  opts: BuildCatalogOptions,
): Promise<BuildCatalogResult> {
  const csvText = await downloadProductFeedCsv(opts.sid, opts.token);
  const records = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true,
  }) as Record<string, string>[];

  const stats: CatalogSyncStats = {
    fetchedAt: new Date().toISOString(),
    totalRows: records.length,
    mapped: 0,
    sellable: 0,
    unmappedCategory: 0,
    nfaExcluded: 0,
    noPrice: 0,
    noImage: 0,
    byTopCategory: {},
  };

  const products: StoreProduct[] = [];
  const max = opts.maxSellable ?? 0;

  for (const row of records) {
    const p = mapRowToStoreProduct(row);
    if (!p.sku) continue;

    stats.mapped++;

    if (p.excludedReason === "nfa_restricted") {
      stats.nfaExcluded++;
      continue;
    }

    if (p.topCategory === "New Arrivals") stats.unmappedCategory++;

    if (p.excludedReason === "no_list_price") stats.noPrice++;
    if (p.excludedReason === "no_image") stats.noImage++;

    if (!p.sellable) continue;

    if (opts.topSlugFilter && p.topSlug !== opts.topSlugFilter) continue;

    stats.sellable++;
    stats.byTopCategory[p.topCategory] = (stats.byTopCategory[p.topCategory] || 0) + 1;
    products.push(p);

    if (max > 0 && products.length >= max) break;
  }

  return { products, stats };
}
