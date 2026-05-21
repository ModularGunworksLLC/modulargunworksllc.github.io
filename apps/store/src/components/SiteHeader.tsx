import Link from "next/link";
import { CATEGORY_NAV, shopCategoryHref } from "@/lib/navigation";

export function SiteHeader({ cartCount = 0 }: { cartCount?: number }) {
  return (
    <header id="site-header">
      <div className="header-top-row">
        <p className="header-site-title">MODULAR GUNWORKS LLC</p>
        <Link href="/" className="header-logo" title="Home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/theme/images/modular-gunworks-llc.png"
            alt="Modular Gunworks Logo"
          />
          <span className="logo-label">HOME</span>
        </Link>
      </div>

      <div className="header-middle-row">
        <div className="header-middle-row-inner">
          <div className="header-left-links">
            <Link href="/order-status">Account</Link>
            <Link href="/help">Help</Link>
            <Link href="/cart">
              <i className="fas fa-shopping-cart" /> Cart{" "}
              <span
                className="cart-count-badge"
                style={{
                  background: "var(--color-primary)",
                  color: "#fff",
                  padding: "2px 6px",
                  borderRadius: 10,
                  fontSize: "0.75rem",
                }}
              >
                {cartCount}
              </span>
            </Link>
          </div>

          <form
            className="search-bar"
            action="/shop"
            method="get"
            role="search"
            aria-label="Search products"
          >
            <input
              type="text"
              name="s"
              placeholder="Search products, ammo, optics… (pickup & ship from Huntsville)"
            />
            <input type="hidden" name="post_type" value="product" />
            <button type="submit">Search</button>
          </form>
        </div>
        <div className="header-local-strip">
          <p className="header-local-tagline">
            Licensed FFL · Transfers & local pickup · Huntsville, Alabama
          </p>
          <nav className="header-local-links" aria-label="Quick local links">
            <Link href="/ffl-transfers">FFL transfers</Link>
            <Link href="/services">Services</Link>
            <Link href="/contact">Contact & hours</Link>
          </nav>
        </div>
      </div>

      <nav className="category-nav">
        {CATEGORY_NAV.map((cat) => (
          <Link
            key={cat.slug}
            href={"href" in cat && cat.href ? cat.href : shopCategoryHref(cat.slug)}
          >
            {cat.name}
          </Link>
        ))}
        <Link href="/services">Services</Link>
      </nav>

      <div className="promo-bar">
        ⭐ Veteran Owned • Huntsville, AL • Professional Service
      </div>
    </header>
  );
}
