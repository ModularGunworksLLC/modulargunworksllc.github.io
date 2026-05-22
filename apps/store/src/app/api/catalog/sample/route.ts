import { NextResponse } from "next/server";
import { buildCatalogFromChattanooga } from "@/lib/chattanooga/catalog";
import { getChattanoogaCredentials } from "@/lib/chattanooga/client";

export const maxDuration = 300;

/**
 * GET /api/catalog/sample?limit=24&top=ammunition
 * Inspect mapped sellable products (requires Chattanooga credentials on server).
 */
export async function GET(request: Request) {
  const creds = getChattanoogaCredentials();
  if (!creds) {
    return NextResponse.json(
      { error: "Set CHATTANOOGA_API_SID and CHATTANOOGA_API_TOKEN in Vercel env" },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "24", 10) || 24, 100);
  const topSlug = searchParams.get("top") || undefined;

  try {
    const { products, stats } = await buildCatalogFromChattanooga({
      sid: creds.sid,
      token: creds.token,
      maxSellable: limit,
      topSlugFilter: topSlug,
    });

    return NextResponse.json({ stats, products });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
