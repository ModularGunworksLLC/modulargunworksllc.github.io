import Link from "next/link";
import { SiteShell } from "@/components/SiteShell";
import { ProductGrid } from "@/components/ProductGrid";
import { CATEGORY_NAV } from "@/lib/navigation";
import { fetchWordPressProducts } from "@/lib/wordpress/catalog";
import { getWordPressStoreUrl } from "@/lib/wordpress/config";

export const metadata = {
  title: "Shop",
  description:
    "Shop firearms, ammunition, optics, and accessories online at Modular Gunworks — veteran-owned FFL in Huntsville, Alabama.",
};

export const revalidate = 300;

type Props = {
  searchParams: Promise<{ product_cat?: string; s?: string; page?: string }>;
};

export default async function ShopPage({ searchParams }: Props) {
  const sp = await searchParams;
  const category = sp.product_cat?.trim() || undefined;
  const search = sp.s?.trim() || undefined;
  const page = Math.max(parseInt(sp.page || "1", 10) || 1, 1);

  const { products, total, totalPages } = await fetchWordPressProducts({
    category,
    search,
    page,
    perPage: 48,
  });

  const activeCat = CATEGORY_NAV.find((c) => c.slug === category);
  const title = activeCat ? activeCat.name : search ? `Search: ${search}` : "Shop";

  return (
    <SiteShell>
      <main className="mgw-shop-wrapper content-section">
        <header className="mgw-shop-page-header">
          <h1 className="mgw-shop-page-title page-title">{title}</h1>
          <p className="mgw-shop-page-desc">
            {total.toLocaleString()} products from your live WordPress catalog (
            {getWordPressStoreUrl()}). Chattanooga direct sync on Vercel is optional.
          </p>
        </header>

        <nav className="shop-category-pills" aria-label="Categories">
          <Link
            href="/shop"
            className={!category ? "shop-pill is-active" : "shop-pill"}
          >
            All
          </Link>
          {CATEGORY_NAV.filter((c) => c.slug !== "brands").map((c) => (
            <Link
              key={c.slug}
              href={`/shop?product_cat=${c.slug}`}
              className={category === c.slug ? "shop-pill is-active" : "shop-pill"}
            >
              {c.name}
            </Link>
          ))}
          <Link href="/brands" className="shop-pill">
            Brands
          </Link>
        </nav>

        <ProductGrid products={products} />

        {totalPages > 1 ? (
          <nav className="shop-pagination" aria-label="Pagination">
            {page > 1 ? (
              <Link
                href={buildShopPageHref({ category, search, page: page - 1 })}
                className="shop-pill"
              >
                ← Previous
              </Link>
            ) : null}
            <span>
              Page {page} of {totalPages}
            </span>
            {page < totalPages ? (
              <Link
                href={buildShopPageHref({ category, search, page: page + 1 })}
                className="shop-pill"
              >
                Next →
              </Link>
            ) : null}
          </nav>
        ) : null}
      </main>
    </SiteShell>
  );
}

function buildShopPageHref(opts: {
  category?: string;
  search?: string;
  page: number;
}): string {
  const q = new URLSearchParams();
  if (opts.category) q.set("product_cat", opts.category);
  if (opts.search) q.set("s", opts.search);
  if (opts.page > 1) q.set("page", String(opts.page));
  const s = q.toString();
  return s ? `/shop?${s}` : "/shop";
}
