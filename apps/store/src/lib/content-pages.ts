export type ContentPage = {
  slug: string;
  title: string;
  description: string;
  body: string;
};

/** Static company/legal pages (ported from WP templates; expand in later phases). */
export const CONTENT_PAGES: ContentPage[] = [
  {
    slug: "about",
    title: "About Modular Gunworks LLC",
    description:
      "About Modular Gunworks — veteran-owned gun shop & licensed FFL serving Huntsville and North Alabama.",
    body: `<h2 class="about-section-title">Our Story</h2>
<p class="about-paragraph">Modular Gunworks LLC was founded on the principles of quality, integrity, and service. As a veteran-owned business, we bring a commitment to excellence and understanding of firearm enthusiasts to everything we do.</p>
<p class="about-paragraph">We believe in providing customers with the highest quality firearms, ammunition, tactical gear, and professional services.</p>
<h3 class="about-section-heading">Why Choose Us?</h3>
<ul class="about-list"><li>Veteran-owned and operated</li><li>Extensive selection of ammunition, gear, and accessories</li><li>Professional gunsmithing and FFL transfer services (licensed FFL)</li><li>Knowledgeable and passionate team</li><li>Competitive pricing</li><li>Commitment to compliance and safety</li></ul>`,
  },
  {
    slug: "contact",
    title: "Contact Us",
    description:
      "Contact Modular Gunworks LLC in Huntsville, Alabama — phone, email, hours, map, FFL transfers, and customer support.",
    body: `<p class="contact-hero-subtitle">Questions about orders, transfers, or services? Call, email, or visit our Huntsville-area FFL storefront.</p>
<div class="contact-wrapper"><div class="contact-info contact-card"><h2>Get in Touch</h2>
<p><strong>Phone:</strong> <a href="tel:+12563843852">(256) 384-3852</a></p>
<p><strong>Email:</strong> <a href="mailto:info@modulargunworks.com">info@modulargunworks.com</a></p>
<p><strong>Location:</strong> Huntsville, AL</p>
<p><strong>Hours:</strong> M-F 9AM-6PM, Sat 10AM-4PM CT</p>
<p><a href="/ffl-transfers">FFL transfer info & fees →</a></p></div></div>`,
  },
  {
    slug: "ffl-transfers",
    title: "FFL Transfers in Huntsville",
    description:
      "FFL transfers in Huntsville, AL — fees, pickup process, and how to ship online purchases to Modular Gunworks.",
    body: `<p>Licensed FFL transfers for online buyers and local customers in Huntsville, Alabama. <a href="/contact">Contact us</a> for current fees and scheduling.</p>`,
  },
  {
    slug: "services",
    title: "Services",
    description:
      "Gunsmithing, FFL transfer services, and counter support at Modular Gunworks in Huntsville, Alabama.",
    body: `<p>FFL transfers, gunsmithing, and counter support at our Huntsville location. See <a href="/gunsmithing">gunsmithing</a> and <a href="/ffl-transfers">FFL transfers</a>.</p>`,
  },
  {
    slug: "gunsmithing",
    title: "Gunsmithing",
    description:
      "Gunsmithing services in Huntsville, AL at Modular Gunworks — cleaning, mounting, inspections, and more.",
    body: `<p>Professional gunsmithing at Modular Gunworks in Huntsville. <a href="/contact">Contact us</a> to schedule.</p>`,
  },
  {
    slug: "faq",
    title: "FAQ",
    description:
      "FAQ for Modular Gunworks — shipping, returns, FFL transfers, orders, and policies at our Huntsville FFL.",
    body: `<p>Common questions about shipping, returns, FFL transfers, and orders. <a href="/contact">Contact us</a> for specifics.</p>`,
  },
  {
    slug: "terms",
    title: "Terms & Conditions",
    description:
      "Terms of Service for Modular Gunworks LLC — eligibility, firearms shipping, pricing, and compliance.",
    body: `<p>Terms of service for purchases and use of this website. Full legal text will be synced from production in a later phase.</p>`,
  },
  {
    slug: "privacy",
    title: "Privacy Policy",
    description: "Privacy policy for Modular Gunworks LLC — data use, disclosure, and security.",
    body: `<p>Privacy policy for Modular Gunworks LLC.</p>`,
  },
  {
    slug: "returns",
    title: "Returns",
    description:
      "Returns and final sale policy for Modular Gunworks — firearms, ammunition, accessories, and transfers.",
    body: `<p>Returns and final sale policies for firearms, ammunition, accessories, and transfers.</p>`,
  },
  {
    slug: "help",
    title: "Help",
    description: "Customer help for Modular Gunworks.",
    body: `<p>Visit <a href="/faq">FAQ</a> or <a href="/contact">contact us</a>.</p>`,
  },
  {
    slug: "brands",
    title: "Shop by Brand",
    description: "Browse top manufacturers at Modular Gunworks.",
    body: `<p>Brand catalog will connect in the shop phase. <a href="/shop">Browse the shop</a>.</p>`,
  },
  {
    slug: "firearm-transfer-guide",
    title: "Firearm Transfer Guide",
    description:
      "How firearm FFL transfers work when you buy online — Modular Gunworks Huntsville guide.",
    body: `<p>Guide to receiving firearms shipped to our Huntsville FFL. See <a href="/ffl-transfers">FFL transfers</a>.</p>`,
  },
  {
    slug: "state-restrictions",
    title: "State Restrictions",
    description:
      "State shipping restrictions for firearms and ammunition — Modular Gunworks compliance overview.",
    body: `<p>Overview of state shipping restrictions. We ship only where lawful.</p>`,
  },
  {
    slug: "order-status",
    title: "Order Status",
    description: "Check your Modular Gunworks order status.",
    body: `<p>Order lookup will be available after checkout is wired on Vercel. For now, email <a href="mailto:info@modulargunworks.com">info@modulargunworks.com</a>.</p>`,
  },
];

export function getContentPage(slug: string): ContentPage | undefined {
  return CONTENT_PAGES.find((p) => p.slug === slug);
}

export function allContentSlugs(): string[] {
  return CONTENT_PAGES.map((p) => p.slug);
}
