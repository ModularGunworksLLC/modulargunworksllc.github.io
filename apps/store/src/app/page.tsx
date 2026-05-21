import Link from "next/link";
import { CategoryCarousel } from "@/components/CategoryCarousel";
import { SiteShell } from "@/components/SiteShell";
import { STORE } from "@/lib/store";

export default function HomePage() {
  return (
    <SiteShell>
      <main>
        <section className="hero-section">
          <h1>Huntsville FFL Gun Shop · Transfers · Local pickup</h1>
          <p>
            Modular Gunworks is a veteran-owned licensed FFL serving North Alabama—professional
            transfers, gunsmithing, and a deep online catalog shipped fast from right here.
          </p>
          <p className="hero-local-meta">
            <a href={`tel:${STORE.phoneTel}`}>{STORE.phone}</a> · Huntsville · M-F 9–6 · Sat 10–4
            CT
          </p>
          <div className="hero-cta-buttons">
            <Link href="/ffl-transfers" className="hero-cta-btn primary">
              FFL transfers
            </Link>
            <Link href="/services" className="hero-cta-btn secondary">
              Services & gunsmithing
            </Link>
            <Link href="/shop" className="hero-cta-btn secondary">
              Shop online catalog
            </Link>
          </div>
        </section>

        <CategoryCarousel />

        <section className="why-shop-section">
          <h2>Why Huntsville Shops Here</h2>
          <div className="why-shop-grid">
            <div className="why-shop-item">
              <i className="fas fa-medal" />
              <h3>Veteran-owned</h3>
              <p>
                Integrity-first service—we treat transfers and local pickups with the same care as
                outbound orders.
              </p>
            </div>
            <div className="why-shop-item">
              <i className="fas fa-store" />
              <h3>Licensed FFL + services</h3>
              <p>
                Transfers at our Huntsville desk, gunsmithing, and help navigating compliant
                shipping—all in one place.
              </p>
            </div>
            <div className="why-shop-item">
              <i className="fas fa-truck" />
              <h3>Deep catalog · fast fulfillment</h3>
              <p>
                Same-day or next-business-day processing whenever possible—we ship compliant orders
                nationwide.
              </p>
            </div>
            <div className="why-shop-item">
              <i className="fas fa-check-circle" />
              <h3>Trusted brands</h3>
              <p>
                Major manufacturers alongside hard-to-find parts—curated alongside our local counter
                service.
              </p>
            </div>
          </div>
        </section>

        <section className="about-section">
          <h2>About Modular Gunworks</h2>
          <p>
            Huntsville Alabama’s Modular Gunworks is a veteran-owned gun shop and FFL—we welcome
            online buyers needing a receiving dealer, Alabama residents picking up transfers, and
            customers who shop our full ecommerce catalog.
          </p>
          <p>
            Fair pricing, honest timelines, and clear communication. Whether you need ammo shipped
            to your door, gear for the range, or a smooth FFL transfer, we are built to serve North
            Alabama first.
          </p>
          <Link href="/about" className="about-cta-link">
            Learn more about us →
          </Link>
        </section>
      </main>
    </SiteShell>
  );
}
