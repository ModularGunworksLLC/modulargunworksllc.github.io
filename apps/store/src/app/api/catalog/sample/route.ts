import { NextResponse } from "next/server";
import { buildCatalogFromChattanooga } from "@/lib/chattanooga/catalog";
import { getChattanoogaCredentials } from "@/lib/chattanooga/client";
import { fetchWordPressProducts } from "@/lib/wordpress/catalog";
import { getWordPressStoreUrl } from "@/lib/wordpress/config";

export const maxDuration = 300;

/**
 * GET /api/catalog/sample?limit=24&top=ammunition
 * Uses Chattanooga API when credentials exist; otherwise live WordPress WooCommerce catalog.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "24", 10) || 24, 100);
  const topSlug = searchParams.get("top") || searchParams.get("category") || undefined;

  const creds = getChattanoogaCredentials();
  if (creds) {
    try {
      const { products, stats } = await buildCatalogFromChattanooga({
        sid: creds.sid,
        token: creds.token,
        maxSellable: limit,
        topSlugFilter: topSlug,
      });
      return NextResponse.json({ source: "chattanooga", stats, products });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      return NextResponse.json({ source: "chattanooga", error: message }, { status: 500 });
    }
  }

  try {
    const { products, total, totalPages, page } = await fetchWordPressProducts({
      category: topSlug,
      perPage: limit,
      page: 1,
    });
    return NextResponse.json({
      source: "wordpress",
      wordpressUrl: getWordPressStoreUrl(),
      note: "Products from live WooCommerce (Chattanooga-synced on WordPress). Add CHATTANOOGA_* env for direct feed mapping.",
      total,
      totalPages,
      page,
      products,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ source: "wordpress", error: message }, { status: 500 });
  }
}
