import Link from "next/link";
import type { CatalogProduct } from "@/lib/catalog/db";

function formatPrice(n: number | null): string {
  if (n == null || n <= 0) return "—";
  return `$${n.toFixed(2)}`;
}

type Props = {
  product: CatalogProduct;
  showSkuAbove?: boolean;
};

export function ProductCard({ product, showSkuAbove }: Props) {
  const isMagazines = product.topSlug === "magazines";
  const skuAbove = showSkuAbove ?? isMagazines;
  const href = `/shop/product/${product.slug}`;
  const inStock = product.stock > 0;

  return (
    <div className="product-card">
      <Link
        href={href}
        className="product-card-link"
        style={{
          textDecoration: "none",
          color: "inherit",
          display: "flex",
          flexDirection: "column",
          flex: 1,
        }}
      >
        <div className="product-image">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.imageUrl} alt={product.name} loading="lazy" />
          ) : (
            <div className="product-image-placeholder">
              <i className="fas fa-box" aria-hidden />
            </div>
          )}
        </div>
        <div className="product-info">
          {skuAbove && product.sku ? (
            <div className="product-sku product-sku-above">{product.sku}</div>
          ) : null}
          <div className="product-brand">{product.brand || product.topCategory}</div>
          <div className="product-name">{product.name}</div>
          <div className="product-pricing">
            <div className="product-price">{formatPrice(product.listPrice)}</div>
            <div
              className={`product-stock ${inStock ? "stock-in" : "stock-out"}`}
            >
              {inStock ? "In Stock" : "Out of Stock"}
            </div>
          </div>
          {product.sku && !skuAbove ? (
            <div className="product-sku">{product.sku}</div>
          ) : null}
        </div>
      </Link>
      <Link href={href} className="product-btn">
        <i className="fas fa-eye" aria-hidden /> View
      </Link>
    </div>
  );
}
