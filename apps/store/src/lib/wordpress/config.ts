/** Live WordPress + WooCommerce Store API (public, no API key). */
export function getWordPressStoreUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_WORDPRESS_STORE_URL ||
    process.env.WORDPRESS_STORE_URL ||
    process.env.NEXT_PUBLIC_LIVE_STORE_URL ||
    "https://www.modulargunworks.com";
  return url.replace(/\/$/, "");
}

export function wcStoreApiUrl(path: string): string {
  const base = getWordPressStoreUrl();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}/wp-json/wc/store/v1${p}`;
}
