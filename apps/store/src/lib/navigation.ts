export const CATEGORY_NAV = [
  { slug: "ammunition", name: "Ammunition" },
  { slug: "magazines", name: "Magazines" },
  { slug: "firearms", name: "Firearms" },
  { slug: "gun-parts", name: "Gun Parts" },
  { slug: "gear", name: "Gear" },
  { slug: "optics", name: "Optics" },
  { slug: "reloading", name: "Reloading" },
  { slug: "outdoors", name: "Outdoors" },
  { slug: "brands", name: "Brands", href: "/brands" },
] as const;

export const HOME_CATEGORIES = [
  { slug: "ammunition", name: "Ammunition", count: "Large selection", img: "ammunition.jpg" },
  { slug: "magazines", name: "Magazines", count: "Pistol · rifle · more", img: "magazines.jpg" },
  { slug: "firearms", name: "Firearms", count: "Handguns, rifles & shotguns", img: "gear.jpg" },
  { slug: "gun-parts", name: "Gun Parts", count: "Repair & upgrades", img: "gun-parts.jpg" },
  { slug: "gear", name: "Tactical Gear", count: "Range & duty", img: "gear.jpg" },
  { slug: "optics", name: "Optics & Sights", count: "Red dots · scopes", img: "optics.jpg" },
  { slug: "reloading", name: "Reloading", count: "Components · tools", img: "reloading.jpg" },
  { slug: "outdoors", name: "Outdoors", count: "Field & hunt", img: "outdoors.jpg" },
  { slug: "brands", name: "Shop by Brand", count: "Top manufacturers", img: "brands.jpg", href: "/brands" },
] as const;

export function shopCategoryHref(slug: string): string {
  if (slug === "brands") return "/brands";
  return `/shop?product_cat=${slug}`;
}
