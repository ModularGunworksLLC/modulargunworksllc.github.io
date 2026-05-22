import type { NormalizedRow } from "@/lib/chattanooga/normalize";

/** Port of is_nfa_vendor_category — WordPress sync excludes these from the storefront. */
export function isNfaVendorCategory(catKey: string): boolean {
  if (!catKey) return false;
  const ck = catKey;
  if (ck.localeCompare("Suppressor Cleaners", undefined, { sensitivity: "accent" }) === 0) {
    return false;
  }
  if (ck.toLowerCase().startsWith("suppressors accessories")) return true;
  if (ck.toLowerCase().includes("suppressor height sights")) return true;
  if (ck.toLowerCase().includes("short barreled rifle")) return true;
  if (ck.toLowerCase().includes("short barreled shotguns")) return true;
  if (/\bNFA\b/i.test(ck)) return true;
  if (ck.localeCompare("Suppressors", undefined, { sensitivity: "accent" }) === 0) return true;
  if (ck.toLowerCase().startsWith("suppressors|")) return true;
  if (ck.toLowerCase().startsWith("suppressors and parts")) return true;
  return false;
}

/** Customer price: MSRP if &gt; 0, else MAP. Dealer CSV Price is NOT retail (WP rule). */
export function resolveListingPrice(n: NormalizedRow, row: Record<string, string>): number | null {
  const msrpRaw = n.msrp || row.MSRP || "";
  const mapRaw = n.map || row.MAP || "";
  const msrp = parseFloat(msrpRaw);
  const map = parseFloat(mapRaw);
  if (Number.isFinite(msrp) && msrp > 0) return msrp;
  if (Number.isFinite(map) && map > 0) return map;
  return null;
}

export function toHighResImageUrl(url: string, size = 800): string {
  if (!url) return "";
  return url.replace(/\?w=\d+&h=\d+/i, `?w=${size}&h=${size}`);
}

export function resolveValidImageUrl(
  n: NormalizedRow,
  row: Record<string, string>,
): string {
  const raw = (n.image_url || row["Image Location"] || row["Image URL"] || "").trim();
  if (!raw) return "";
  const img = toHighResImageUrl(raw, 800);
  try {
    const u = new URL(img);
    if (u.protocol !== "http:" && u.protocol !== "https:") return "";
    return img;
  } catch {
    return "";
  }
}

export function parseDealerPrice(n: NormalizedRow, row: Record<string, string>): number | null {
  const raw = n.price || row.Price || "";
  const v = parseFloat(raw);
  return Number.isFinite(v) ? v : null;
}
