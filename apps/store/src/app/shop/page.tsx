import Link from "next/link";
import { SiteShell } from "@/components/SiteShell";
import { ProductGrid } from "@/components/ProductGrid";
import { CATEGORY_NAV } from "@/lib/navigation";
import {
  getCatalogProductCount,
  hasCatalogDatabase,
  listCatalogProducts,
} from "@/lib/catalog/db";

export const metadata = {
  title: "Shop",
  description:
    "Shop firearms, ammunition, optics, and accessories online at Modular Gunworks — veteran-owned FFL in Huntsville, Alabama.",
};

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ product_cat?: string; s?: string; page?: string }>;
};

export default async function ShopPage({ searchParams }: Props) {
  const sp = await searchParams;
  const category = sp.product_cat?.trim() || undefined;
  const search = sp.s?.trim() || undefined;
  const page = Math.max(parseInt(sp.page || "1", 10) || 1, 1);

  if (!hasCatalogDatabase()) {
    return (
      <SiteShell>
        <main className="mgw-shop-wrapper content-section">
          <h1 className="page-title">Shop</h1>
          <p className="shop-empty">
            Catalog database is not configured on this deployment. Add{" "}
            <code>TURSO_DATABASE_URL</code> and <code>TURSO_AUTH_TOKEN</code> on Vercel,
            push Chattanooga credentials from Lightsail, then run{" "}
            <code>POST /api/catalog/sync</code>.
          </p>
        </main>
      </SiteShell>
    );
  }

  const totalInDb = await getCatalogProductCount();
  const { products, total, totalPages } = await listCatalogProducts({
    topSlug: category,
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
            {totalInDb === 0
              ? "Catalog database is empty — sync from Chattanooga API required."
              : `${total.toLocaleString()} products · ${totalInDb.toLocaleString()} in catalog DB (Chattanooga feed, not Lightsail)`}
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
