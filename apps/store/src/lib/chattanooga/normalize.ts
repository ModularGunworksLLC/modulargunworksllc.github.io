import chattanoogaMap from "@/data/chattanooga/chattanooga-map.json";

export type NormalizedRow = Record<string, string>;

const COLUMN_MAP = chattanoogaMap.columns as Record<string, string[]>;

const KEYS = [
  "sku",
  "name",
  "price",
  "stock",
  "brand",
  "category_key",
  "image_url",
  "description",
  "upc",
  "msrp",
  "map",
  "caliber",
  "bullet_type",
  "grain",
  "round_count",
  "capacity",
  "gauge",
  "velocity",
  "shot_size",
  "casing",
  "product_line",
  "style",
] as const;

/** Port of MGW_Normalizer::normalize (WordPress plugin). */
export function normalizeVendorRow(row: Record<string, string>): NormalizedRow {
  const out: NormalizedRow = {};
  for (const key of KEYS) {
    const candidates = COLUMN_MAP[key] ?? [key];
    let value = "";
    for (const col of candidates) {
      const v = row[col];
      if (v !== undefined && String(v).trim() !== "") {
        value = String(v).trim();
        break;
      }
    }
    out[key] = value;
  }
  return out;
}
