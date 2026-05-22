import Link from "next/link";
import { SiteShell } from "@/components/SiteShell";

export const metadata = {
  title: "Shop",
  description:
    "Shop firearms, ammunition, optics, and accessories online at Modular Gunworks — veteran-owned FFL in Huntsville, Alabama.",
};

export default function ShopPage() {
  return (
    <SiteShell>
      <main className="content-section shop-catalog-intro">
        <h1 className="page-title">Shop</h1>
        <p>
          The catalog is wired to the <strong>Chattanooga Shooting API</strong> using the same
          mapping rules as your WordPress <code>mgw-chattanooga-sync</code> plugin—not the old
          GitHub Pages static JSON.
        </p>
        <h2>Current status</h2>
        <ul>
          <li>Chattanooga client + CSV download: implemented</li>
          <li>Category mapping + normalizer: ported from WordPress</li>
          <li>Product grid on this page: next (after catalog is stored on Vercel)</li>
        </ul>
        <h2>For developers</h2>
        <p>
          Add <code>CHATTANOOGA_API_SID</code> and <code>CHATTANOOGA_API_TOKEN</code> in Vercel env,
          then inspect mapped products:
        </p>
        <p>
          <code>/api/catalog/sample?limit=24&amp;top=ammunition</code>
        </p>
        <p>
          See <Link href="https://github.com/ModularGunworksLLC/modulargunworksllc.github.io/blob/main/apps/store/CATALOG.md">apps/store/CATALOG.md</Link> in the repo.
        </p>
        <p>
          Your live catalog remains at{" "}
          <a href="https://www.modulargunworks.com/shop/">modulargunworks.com/shop</a> until cutover.
        </p>
      </main>
    </SiteShell>
  );
}
