import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/SiteShell";
import {
  getCatalogProductBySlug,
  hasCatalogDatabase,
} from "@/lib/catalog/db";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  if (!hasCatalogDatabase()) return { title: "Product" };
  const product = await getCatalogProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  return {
    title: product.name,
    description: product.name.replace(/<[^>]+>/g, "").slice(0, 160),
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;

  if (!hasCatalogDatabase()) {
    return (
      <SiteShell>
        <main className="content-section">
          <p>Catalog database not configured on this deployment.</p>
        </main>
      </SiteShell>
    );
  }

  const product = await getCatalogProductBySlug(slug);
  if (!product) notFound();

  const price =
    product.listPrice != null && product.listPrice > 0
      ? `$${product.listPrice.toFixed(2)}`
      : "—";
  const inStock = product.stock > 0;

  return (
    <SiteShell>
      <main className="content-section mgw-product-detail">
        <p className="breadcrumb">
          <Link href="/shop">Shop</Link>
          {product.topSlug ? (
            <>
              {" "}
              /{" "}
              <Link href={`/shop?product_cat=${product.topSlug}`}>
                {product.topCategory}
              </Link>
            </>
          ) : null}
        </p>

        <div className="mgw-product-detail-grid">
          <div className="mgw-product-detail-image">
            {product.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.imageUrl} alt={product.name} />
            ) : (
              <div className="product-image-placeholder">
                <i className="fas fa-box" aria-hidden />
              </div>
            )}
          </div>
          <div className="mgw-product-detail-info">
            <p className="product-brand">{product.brand || product.topCategory}</p>
            <h1 className="page-title">{product.name}</h1>
            <p className="product-price" style={{ fontSize: "1.5rem", fontWeight: 600 }}>
              {price}
            </p>
            <p
              className={`product-stock ${inStock ? "stock-in" : "stock-out"}`}
            >
              {inStock ? "In Stock" : "Out of Stock"}
            </p>
            {product.sku ? <p className="product-sku">SKU: {product.sku}</p> : null}
            {product.description ? (
              <div
                className="product-description"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            ) : null}
            <p className="request-service-note" style={{ marginTop: "1.5rem" }}>
              Cart and checkout on this preview are coming next. Until then, purchase at{" "}
              <a href={process.env.NEXT_PUBLIC_LIVE_STORE_URL || "https://www.modulargunworks.com"}>
                modulargunworks.com
              </a>
              .
            </p>
          </div>
        </div>
      </main>
    </SiteShell>
  );
}
