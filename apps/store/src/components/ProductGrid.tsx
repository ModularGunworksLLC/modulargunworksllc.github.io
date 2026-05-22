import { ProductCard } from "./ProductCard";
import type { CatalogProduct } from "@/lib/catalog/db";

type Props = {
  products: CatalogProduct[];
};

export function ProductGrid({ products }: Props) {
  if (!products.length) {
    return (
      <p className="shop-empty">
        No products in the catalog database yet. Run a Chattanooga sync (
        <code>POST /api/catalog/sync</code>) after Turso and API credentials are set on
        Vercel.
      </p>
    );
  }

  return (
    <div className="products-grid">
      {products.map((p) => (
        <ProductCard key={p.sku} product={p} />
      ))}
    </div>
  );
}
