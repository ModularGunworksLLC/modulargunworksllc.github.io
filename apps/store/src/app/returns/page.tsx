import Link from "next/link";
import { SiteShell } from "@/components/SiteShell";

export const metadata = {
  title: "Returns & Final Sales",
  description:
    "Returns and final sale policy for Modular Gunworks — firearms, ammunition, accessories, and transfers.",
};

export default function ReturnsPage() {
  return (
    <SiteShell>
      <main>
        <h1 className="page-title">Returns &amp; Final Sales</h1>
        <div className="content-section">
          <p>
            <strong>Last Updated: February 2026</strong>
          </p>
          <p>
            Certain items—including firearms (once transfer paperwork is executed) and most
            ammunition sales—are generally <strong>final</strong> for compliance and safety
            reasons unless the law mandates otherwise.
          </p>

          <h2>Firearms &amp; ammunition</h2>
          <p>
            All firearm and ammunition sales are final once lawful transfer paperwork is
            executed or ammunition leaves our control pursuant to shipment rules.
          </p>
          <p>
            Inspect items at your receiving FFL before completing the Form 4473 (or equivalent).
            After the transfer is approved and you take possession the firearm is yours and not
            returnable because you changed your mind.
          </p>
          <p>
            For used, estate, consignment, or auction-style listings we provide descriptions and
            photos to the extent practicable. By completing the transaction you acknowledge those
            materials were your inspection opportunity absent fraud or concealment attributable to
            Modular Gunworks.
          </p>

          <h2>Transfers that fail background checks</h2>
          <p>
            When we ship outbound to another licensee and your buyer fails or abandons their
            background investigation, lawful storage/return freight and restocking rules from our
            Terms apply so we are not asked to subsidize preventable compliance failures.
          </p>

          <h2>Eligible non-regulated merchandise</h2>
          <p>
            Accessory and consumer items that lawfully may be shipped direct (where not
            hazmat-restricted) may be eligible for return within thirty (30) days of delivery when
            unused, in salable packaging, and after you receive a written return merchandise
            authorization.
          </p>
          <ol>
            <li>
              Email <a href="mailto:sales@modulargunworks.com">sales@modulargunworks.com</a> or
              call (256) 384-3852 with your order number.
            </li>
            <li>We send RMA instructions; unauthorized returns may be refused.</li>
            <li>
              Refunds typically post within five to seven business days after we inspect the
              return.
            </li>
          </ol>

          <h2>Damaged or incorrect shipments</h2>
          <p>
            Inspect packages promptly and contact us immediately with photographs for carrier
            damage or our fulfillment mistakes. If we verified the defect we coordinate
            replacement/refund remedies subject to distributor rules.
          </p>

          <p>
            <Link href="/contact">Need help? Reach our team.</Link>
          </p>
        </div>
      </main>
    </SiteShell>
  );
}
