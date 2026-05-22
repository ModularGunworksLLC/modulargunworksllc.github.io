/** Pages still served via /[slug] — dedicated routes take precedence. */
export type ContentPage = {
  slug: string;
  title: string;
  description: string;
  body: string;
};

export const CONTENT_PAGES: ContentPage[] = [
  {
    slug: "brands",
    title: "Shop by Brand",
    description: "Browse top manufacturers at Modular Gunworks.",
    body: `<p>Brand catalog will connect in the shop phase. <a href="/shop">Browse the shop</a>.</p>`,
  },
];

export function getContentPage(slug: string): ContentPage | undefined {
  return CONTENT_PAGES.find((p) => p.slug === slug);
}

export function allContentSlugs(): string[] {
  return CONTENT_PAGES.map((p) => p.slug);
}
