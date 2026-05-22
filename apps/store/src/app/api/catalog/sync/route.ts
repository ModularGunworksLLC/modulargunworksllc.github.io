import { NextResponse } from "next/server";
import { buildCatalogFromChattanooga } from "@/lib/chattanooga/catalog";
import { getChattanoogaCredentials } from "@/lib/chattanooga/client";

export const maxDuration = 300;

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET || process.env.CATALOG_SYNC_SECRET;
  if (!secret) return process.env.NODE_ENV === "development";
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

/**
 * POST /api/catalog/sync
 * Pulls Chattanooga /items/product-feed and returns mapping stats + sample products.
 * Full catalog persistence (DB/Blob) is the next step.
 */
export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const creds = getChattanoogaCredentials();
  if (!creds) {
    return NextResponse.json(
      {
        error: "Missing CHATTANOOGA_API_SID and CHATTANOOGA_API_TOKEN in environment",
      },
      { status: 500 },
    );
  }

  let maxSellable = 50;
  try {
    const body = await request.json().catch(() => ({}));
    if (typeof body.maxSellable === "number") maxSellable = body.maxSellable;
  } catch {
    /* empty body ok */
  }

  try {
    const { products, stats } = await buildCatalogFromChattanooga({
      sid: creds.sid,
      token: creds.token,
      maxSellable,
    });

    return NextResponse.json({
      ok: true,
      message:
        "Catalog pulled from Chattanooga API using WordPress category-mapping + normalizer rules.",
      stats,
      sample: products.slice(0, 20),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
