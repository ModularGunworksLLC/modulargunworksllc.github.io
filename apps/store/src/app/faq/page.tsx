import Link from "next/link";
import { SiteShell } from "@/components/SiteShell";
import { FaqAccordion } from "@/components/FaqAccordion";

export const metadata = {
  title: "FAQ",
  description:
    "FAQ for Modular Gunworks — shipping, returns, FFL transfers, orders, and policies at our Huntsville FFL.",
};

const FAQ_CATEGORIES = [
  {
    title: "Services",
    items: [
      {
        question: "Are gunsmithing and FFL transfers available?",
        answer: (
          <p>
            Yes. We are a licensed FFL and offer gunsmithing, FFL transfers, and related
            services. See our <Link href="/services">Services</Link>,{" "}
            <Link href="/ffl-transfers">FFL Transfers</Link>, and{" "}
            <Link href="/gunsmithing">Gunsmithing</Link> pages for details, or{" "}
            <Link href="/contact">contact us</Link>.
          </p>
        ),
      },
    ],
  },
  {
    title: "Shipping & Returns",
    items: [
      {
        question: "Do you ship nationwide?",
        answer: (
          <p>
            Yes, we ship to most states. Firearms, ammunition, and certain items are subject
            to state and local restrictions. We comply with all applicable laws.
          </p>
        ),
      },
      {
        question: "What is your return policy?",
        answer: (
          <p>
            Firearms and ammunition sales are final once a lawful transfer occurs or the
            ammunition ships, per our <Link href="/returns">Returns</Link> page. Some
            accessories may qualify for return within thirty days with authorization.
          </p>
        ),
      },
      {
        question: "What are your shipping costs?",
        answer: (
          <p>
            Shipping costs depend on your order, destination, and carrier rates. Totals are
            shown in your cart and at checkout before you pay.
          </p>
        ),
      },
      {
        question: "Can prices or availability change after I order?",
        answer: (
          <p>
            Pricing and inventory sync from large distributor feeds; errors can occur. We
            reserve the right to cancel orders caused by mispricing or technical glitches—see
            our <Link href="/terms">Terms</Link>.
          </p>
        ),
      },
    ],
  },
  {
    title: "Orders & Payment",
    items: [
      {
        question: "What payment methods do you accept?",
        answer: (
          <p>
            We accept major credit cards and other payment options shown at checkout. All
            transactions are secure.
          </p>
        ),
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <SiteShell>
      <main className="faq-page">
        <h1 className="page-title">Frequently Asked Questions</h1>
        <p className="page-intro">
          Find answers to common questions about our services, products, and policies.
        </p>
        <FaqAccordion categories={FAQ_CATEGORIES} />
      </main>
    </SiteShell>
  );
}
