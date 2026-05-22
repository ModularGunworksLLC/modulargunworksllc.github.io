import { SiteShell } from "@/components/SiteShell";

export const metadata = {
  title: "About Us",
  description:
    "About Modular Gunworks — veteran-owned gun shop & licensed FFL serving Huntsville and North Alabama.",
};

export default function AboutPage() {
  return (
    <SiteShell>
      <main>
        <h1 className="page-title">About Modular Gunworks LLC</h1>
        <div className="about-content content-section">
          <h2 className="about-section-title">Our Story</h2>
          <p className="about-paragraph">
            Modular Gunworks LLC was founded on the principles of quality, integrity, and
            service. As a veteran-owned business, we bring a commitment to excellence and
            understanding of firearm enthusiasts to everything we do.
          </p>
          <p className="about-paragraph">
            We believe in providing customers with the highest quality firearms, ammunition,
            tactical gear, and professional services. Whether you&apos;re a competitive shooter,
            hunter, or firearms enthusiast, we&apos;re here to support your needs with expert
            knowledge and competitive pricing.
          </p>
          <h3 className="about-section-heading">Why Choose Us?</h3>
          <ul className="about-list">
            <li>Veteran-owned and operated</li>
            <li>Extensive selection of ammunition, gear, and accessories</li>
            <li>Professional gunsmithing and FFL transfer services (licensed FFL)</li>
            <li>Knowledgeable and passionate team</li>
            <li>Competitive pricing</li>
            <li>Commitment to compliance and safety</li>
          </ul>
          <h3 className="about-section-heading">Our Commitment</h3>
          <p className="about-paragraph">
            We are committed to serving our customers with integrity, providing quality
            products, and maintaining the highest standards of firearm safety and legal
            compliance. Your satisfaction is our priority.
          </p>
        </div>
      </main>
    </SiteShell>
  );
}
