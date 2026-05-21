import Link from "next/link";
import { SiteShell } from "@/components/SiteShell";

export const metadata = { title: "Cart" };

export default function CartPage() {
  return (
    <SiteShell>
      <main className="shop-placeholder">
        <h1 className="page-title">Cart</h1>
        <p>Cart and checkout (PaymentHub / GunTab) will be wired in a later phase.</p>
        <p>
          <Link href="/shop">Continue shopping</Link>
        </p>
      </main>
    </SiteShell>
  );
}
