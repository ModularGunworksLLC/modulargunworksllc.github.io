import { SiteShell } from "@/components/SiteShell";

type Props = {
  searchParams: Promise<{ s?: string; product_cat?: string }>;
};

export const metadata = {
  title: "Shop",
  description:
    "Shop firearms, ammunition, optics, and accessories online at Modular Gunworks — veteran-owned FFL in Huntsville, Alabama.",
};

export default async function ShopPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = params.s?.trim();
  const category = params.product_cat?.trim();

  return (
    <SiteShell>
      <main className="shop-placeholder">
        <h1 className="page-title">Shop</h1>
        {category ? (
          <p>
            Category: <strong>{category.replace(/-/g, " ")}</strong>
          </p>
        ) : null}
        {query ? (
          <p>
            Search: <strong>{query}</strong>
          </p>
        ) : null}
        <p>
          Product catalog API and filters are connecting in the next phase (Chattanooga sync +
          WooCommerce data export). Layout and navigation match your WordPress theme.
        </p>
        <p>
          Your live catalog remains at{" "}
          <a href="https://www.modulargunworks.com/shop/">modulargunworks.com/shop</a> until cutover.
        </p>
      </main>
    </SiteShell>
  );
}
