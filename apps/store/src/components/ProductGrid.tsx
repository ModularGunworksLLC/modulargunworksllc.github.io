import { ProductCard } from "./ProductCard";
import type { WcProductCard } from "@/lib/wordpress/map-product";

type Props = {
  products: WcProductCard[];
};

export function ProductGrid({ products }: Props) {
  if (!products.length) {
    return (
      <p className="shop-empty">
        No products found in this category. Try another category or check back after
        the next catalog sync on the live store.
      </p>
    );
  }

  return (
    <div className="products-grid">
      {products.map((p) => (
        <ProductCard key={p.slug} product={p} />
      ))}
    </div>
  );
}
