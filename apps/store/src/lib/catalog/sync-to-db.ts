import { buildCatalogFromChattanooga } from "@/lib/chattanooga/catalog";
import { getChattanoogaCredentials } from "@/lib/chattanooga/client";
import {
  getCatalogStats,
  hasCatalogDatabase,
  replaceCatalogProducts,
} from "@/lib/catalog/db";
import type { CatalogSyncStats } from "@/lib/catalog/types";

export async function syncChattanoogaCatalogToDatabase(): Promise<{
  stats: CatalogSyncStats;
  inserted: number;
}> {
  if (!hasCatalogDatabase()) {
    throw new Error(
      "Catalog database not configured. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN on Vercel.",
    );
  }

  const creds = getChattanoogaCredentials();
  if (!creds) {
    throw new Error(
      "Missing CHATTANOOGA_API_SID and CHATTANOOGA_API_TOKEN (sync from WordPress: npm run sync:env)",
    );
  }

  const { products, stats } = await buildCatalogFromChattanooga({
    sid: creds.sid,
    token: creds.token,
    maxSellable: 0,
  });

  const { inserted } = await replaceCatalogProducts(products, stats);
  return { stats, inserted };
}

export async function getLastSyncStats(): Promise<CatalogSyncStats | null> {
  return getCatalogStats();
}
