import Link from "next/link";
import { SiteShell } from "@/components/SiteShell";
import { STORE } from "@/lib/store";

export const metadata = { title: "Order Status" };

export default function OrderStatusPage() {
  return (
    <SiteShell>
      <main className="content-section">
        <h1 className="page-title">Order Status</h1>
        <p>
          Order lookup will be available after checkout is wired on Vercel. For now, email{" "}
          <a href={`mailto:${STORE.email}`}>{STORE.email}</a> or call{" "}
          <a href={`tel:${STORE.phoneTel}`}>{STORE.phone}</a> with your order number.
        </p>
        <p>
          <Link href="/contact">Contact us →</Link>
        </p>
      </main>
    </SiteShell>
  );
}
