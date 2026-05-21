import Link from "next/link";
import { CATEGORY_NAV, shopCategoryHref } from "@/lib/navigation";
import { STORE } from "@/lib/store";

export function SiteFooter() {
  const year = new Date().getFullYear();
  const footerCats = CATEGORY_NAV.filter((c) => c.slug !== "firearms");

  return (
    <footer>
      <div className="footer-content">
        <div className="footer-section">
          <h3>Shop</h3>
          <ul>
            {footerCats.map((cat) => (
              <li key={cat.slug}>
                <Link
                  href={"href" in cat && cat.href ? cat.href : shopCategoryHref(cat.slug)}
                >
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="footer-section">
          <h3>Company</h3>
          <ul>
            <li>
              <Link href="/about">About Us</Link>
            </li>
            <li>
              <Link href="/contact">Contact</Link>
            </li>
            <li>
              <Link href="/faq">FAQ</Link>
            </li>
            <li>
              <Link href="/blog">Blog</Link>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>Legal</h3>
          <ul>
            <li>
              <Link href="/terms">Terms & Conditions</Link>
            </li>
            <li>
              <Link href="/privacy">Privacy Policy</Link>
            </li>
            <li>
              <Link href="/returns">Returns</Link>
            </li>
            <li>
              <Link href="/ffl-transfers">FFL transfers in Huntsville</Link>
            </li>
            <li>
              <Link href="/order-status">Order Status</Link>
            </li>
            <li>
              <Link href="/state-restrictions">State Restrictions</Link>
            </li>
            <li>
              <Link href="/firearm-transfer-guide">Firearm Transfer Guide</Link>
            </li>
          </ul>
        </div>

        <div className="footer-section footer-newsletter">
          <h3>Newsletter</h3>
          <p className="newsletter-tagline">Get deals & restock alerts</p>
          <form className="newsletter-form" action="#" method="post">
            <input type="text" name="FNAME" placeholder="First name" disabled autoComplete="given-name" />
            <input type="email" name="EMAIL" placeholder="Email" disabled autoComplete="email" />
            <button type="submit" disabled>
              Sign up
            </button>
          </form>
          <p className="newsletter-admin-hint" style={{ fontSize: "0.85rem", opacity: 0.8 }}>
            Newsletter connects in a later phase.
          </p>
        </div>

        <div className="footer-section">
          <h3>Contact</h3>
          <p>
            <strong>Phone:</strong>{" "}
            <a href={`tel:${STORE.phoneTel}`}>{STORE.phone}</a>
            <br />
            <strong>Email:</strong>{" "}
            <a href={`mailto:${STORE.email}`}>{STORE.email}</a>
            <br />
            <strong>Location:</strong>
            <br />
            <span className="footer-address-block">{STORE.addressDisplay}</span>
            <br />
            <strong>Hours:</strong> {STORE.hours}
          </p>
          <p>
            <Link href="/contact">Directions & contact form →</Link>
          </p>
        </div>
      </div>

      <div className="footer-local-strip footer-wide">
        <p>
          Modular Gunworks LLC is a veteran-owned gun shop and licensed FFL in Huntsville,
          Alabama. We specialize in compliant FFL transfers for online buyers, in-store pickup,
          gunsmithing, and shipping lawful orders nationwide from our North Alabama operation.
        </p>
        <div className="footer-local-quicklinks">
          <Link href="/ffl-transfers">FFL transfers in Huntsville</Link>
          <Link href="/services">Gunsmithing & services</Link>
          <Link href="/contact">Visit & contact</Link>
          <Link href="/shop">Shop the catalog</Link>
        </div>
      </div>

      <div className="footer-bottom">
        <p>
          © {year} Modular Gunworks LLC. All rights reserved. | Veteran-Owned Business in
          Huntsville, Alabama
        </p>
        <p>
          We are a licensed FFL and offer firearm sales and transfers in compliance with federal,
          state, and local laws.
        </p>
      </div>
    </footer>
  );
}
