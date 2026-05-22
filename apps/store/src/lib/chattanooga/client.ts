import { createHash } from "node:crypto";
import { env, hasChattanoogaCredentials } from "@/lib/env";

const API_BASE = "https://api.chattanoogashooting.com/rest/v5";

function authHeader(sid: string, token: string): string {
  const tokenHash = createHash("md5").update(token).digest("hex");
  return `Basic ${sid}:${tokenHash}`;
}

export function getChattanoogaCredentials(): { sid: string; token: string } | null {
  if (!hasChattanoogaCredentials()) return null;
  return { sid: env.chattanooga.sid, token: env.chattanooga.token };
}

export async function fetchChattanoogaApi(
  endpoint: string,
  sid: string,
  token: string,
): Promise<Record<string, unknown>> {
  const url = `${API_BASE}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  const res = await fetch(url, {
    headers: {
      Authorization: authHeader(sid, token),
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(120_000),
  });
  const body = await res.text();
  if (!res.ok) {
    const snippet = body.length > 600 ? `${body.slice(0, 600)}…` : body;
    throw new Error(`Chattanooga API HTTP ${res.status}: ${snippet}`);
  }
  const data = JSON.parse(body) as Record<string, unknown>;
  if (!data || typeof data !== "object") {
    throw new Error(`Chattanooga API returned non-object JSON for ${endpoint}`);
  }
  return data;
}

/** GET /items/product-feed → temporary signed CSV URL (same as WordPress sync). */
export function extractProductFeedCsvUrl(data: Record<string, unknown>): string {
  const nested =
    data.data && typeof data.data === "object"
      ? (data.data as Record<string, unknown>)
      : {};
  const candidates = [
    (data.product_feed as { url?: string })?.url,
    (data.productFeed as { url?: string })?.url,
    (nested.product_feed as { url?: string })?.url,
    (nested.productFeed as { url?: string })?.url,
    data.url,
    data.feed_url,
    data.product_feed_url,
  ];
  for (const u of candidates) {
    if (typeof u === "string" && u.trim()) return u.trim();
  }
  return "";
}

export async function downloadProductFeedCsv(sid: string, token: string): Promise<string> {
  const meta = await fetchChattanoogaApi("/items/product-feed", sid, token);
  const csvUrl = extractProductFeedCsvUrl(meta);
  if (!csvUrl) {
    throw new Error(
      `Chattanooga API returned no product feed URL. Keys: ${Object.keys(meta).join(", ")}`,
    );
  }
  const res = await fetch(csvUrl, { signal: AbortSignal.timeout(600_000) });
  if (!res.ok) {
    throw new Error(`Downloading product feed CSV failed: HTTP ${res.status}`);
  }
  return res.text();
}
