import { NextResponse } from "next/server";
import { syncChattanoogaCatalogToDatabase } from "@/lib/catalog/sync-to-db";
import { getChattanoogaCredentials } from "@/lib/chattanooga/client";
import { hasCatalogDatabase } from "@/lib/catalog/db";
import { env } from "@/lib/env";

export const maxDuration = 300;

function authorized(request: Request): boolean {
  const secret = env.catalogSyncSecret;
  if (!secret) return process.env.NODE_ENV === "development";
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

/**
 * POST /api/catalog/sync
 * Chattanooga product-feed → Turso catalog DB (same mapping as WordPress mgw-chattanooga-sync).
 */
export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasCatalogDatabase()) {
    return NextResponse.json(
      {
        error:
          "Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN on Vercel (Turso free tier: https://turso.tech)",
      },
      { status: 500 },
    );
  }

  if (!getChattanoogaCredentials()) {
    return NextResponse.json(
      {
        error:
          "Missing CHATTANOOGA_API_SID and CHATTANOOGA_API_TOKEN. Run sync:env on Lightsail then push to Vercel.",
      },
      { status: 500 },
    );
  }

  try {
    const { stats, inserted } = await syncChattanoogaCatalogToDatabase();
    return NextResponse.json({
      ok: true,
      message:
        "Chattanooga feed synced to Vercel catalog database (not Lightsail WordPress).",
      inserted,
      stats,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
