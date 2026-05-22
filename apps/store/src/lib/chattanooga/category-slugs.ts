/** Port of MGW_Chattanooga_Sync::top_to_slug / sub_to_slug (WordPress). */

const TOP_SLUG_MAP: Record<string, string> = {
  Ammunition: "ammunition",
  Magazines: "magazines",
  Firearms: "firearms",
  "Gun Parts": "gun-parts",
  Gear: "gear",
  Optics: "optics",
  Reloading: "reloading",
  Outdoors: "outdoors",
  "Clothing & Footwear": "gear",
  Knives: "gear",
};

export function topToSlug(top: string): string {
  return TOP_SLUG_MAP[top] ?? top.toLowerCase().replace(/\s+/g, "-");
}

export function subToSlug(top: string, sub: string | null | undefined): string | null {
  if (!sub || typeof sub !== "string") return null;
  let segment = sub.trim();
  if (segment.includes("|")) {
    segment = segment.split("|")[0]?.trim() ?? segment;
  }
  const u = segment.toUpperCase();

  if (top === "Ammunition") {
    if (u.includes("RIMFIRE")) return "rimfire";
    if (u.includes("HANDGUN")) return "handgun";
    if (u.includes("RIFLE")) return "rifle";
    if (u.includes("SHOTGUN")) return "shotgun";
  }
  if (top === "Magazines") {
    if (u.includes("HANDGUN")) return "handgun-magazines";
    if (u.includes("RIFLE")) return "rifle-magazines";
    if (u.includes("SHOTGUN")) return "shotgun-magazines";
  }
  if (top === "Firearms") {
    if (u.includes("HANDGUN")) return "handguns";
    if (u.includes("SHORT BARREL") && u.includes("RIFLE")) return "short-barreled-rifles";
    if (u.includes("RIFLE")) return "rifles";
    if (u.includes("SHOTGUN")) return "shotguns";
    if (u.includes("LOWER")) return "lowers";
    if (u.includes("USED")) return "used-guns";
    if (u.includes("CA COMPLIANT")) return "ca-compliant";
    if (u.includes("MA COMPLIANT")) return "ma-compliant";
  }
  if (top === "Gun Parts") {
    const segments = segment.split("|").map((s) => s.trim()).filter(Boolean);
    if (!segments.length) return null;
    const candidate = segments[segments.length - 1] ?? "";
    if (/CSSI Exclusive/i.test(candidate)) return null;
    const slug = candidate
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    return slug || null;
  }
  return null;
}
