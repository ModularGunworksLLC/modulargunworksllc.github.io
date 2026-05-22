import { NextResponse } from "next/server";
import {
  getCatalogProductCount,
  hasCatalogDatabase,
  listCatalogProducts,
} from "@/lib/catalog/db";

/**
 * GET /api/catalog/sample?limit=24&top=ammunition
 * Reads sellable products from Turso (populated by POST /api/catalog/sync).
 */
export async function GET(request: Request) {
  if (!hasCatalogDatabase()) {
    return NextResponse.json(
      {
        error:
          "Catalog DB not configured. Add TURSO_DATABASE_URL + TURSO_AUTH_TOKEN, then POST /api/catalog/sync",
      },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "24", 10) || 24, 100);
  const topSlug = searchParams.get("top") || searchParams.get("category") || undefined;

  try {
    const total = await getCatalogProductCount();
    if (total === 0) {
      return NextResponse.json({
        source: "turso",
        total: 0,
        message:
          "Database empty. POST /api/catalog/sync with Authorization: Bearer CRON_SECRET",
      });
    }

    const { products, total: filtered } = await listCatalogProducts({
      topSlug,
      perPage: limit,
      page: 1,
    });

    return NextResponse.json({
      source: "turso",
      totalInDb: total,
      filtered,
      products,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
