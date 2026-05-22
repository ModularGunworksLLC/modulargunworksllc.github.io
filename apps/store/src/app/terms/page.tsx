import Link from "next/link";
import { SiteShell } from "@/components/SiteShell";

export const metadata = {
  title: "Terms of Service",
  description:
    "Terms of Service for Modular Gunworks LLC — eligibility, firearms shipping, pricing, and compliance.",
};

export default function TermsPage() {
  return (
    <SiteShell>
      <main>
        <h1 className="page-title">Terms of Service</h1>
        <div className="content-section">
          <p>
            <strong>Last Updated: February 2026</strong>
          </p>
          <p>
            These Terms govern your access to Modular Gunworks LLC&apos;s website and your
            purchase or use of our products and services. By placing an order or using this site
            you agree to these Terms and our Returns and Privacy policies.
          </p>

          <h2>Eligibility &amp; transferee acknowledgement</h2>
          <p>
            You must comply with federal, state, and local laws. Age requirements commonly include
            21+ for handguns (and handgun ammunition and frames/receivers in many jurisdictions)
            and 18+ for rifles, shotguns, and rifle/shotgun ammunition—but your location may
            differ.
          </p>
          <p>
            You represent that you are the actual transferee/purchaser, that you are not legally
            prohibited from receiving or possessing the items ordered, and that shipment and
            possession where you reside are lawful. Modular Gunworks may refuse or cancel any
            order if we believe a straw purchase, fraud, or other violation may occur.
          </p>

          <h2>Orders, pricing accuracy &amp; cancellations</h2>
          <p>
            Pricing, availability, and descriptions rely on catalogs and integrations; mistakes
            can occur despite our diligence. Prices are subject to change without notice.
          </p>
          <p>
            If an item&apos;s price was listed incorrectly due to manual error, distributor feed
            anomalies, or technical glitches, we may cancel the order and issue a full refund for
            any payment collected. We will attempt to notify you promptly when that happens.
          </p>
          <p>
            All orders are subject to acceptance, inventory, and compliance review. Payment must
            be authorized before shipment unless we expressly agree otherwise.
          </p>

          <h2>Firearms, ammunition &amp; regulated items</h2>
          <p>
            Firearms must ship to a licensed FFL (not a residence or P.O. box). You must complete
            an ATF Form 4473 and any required background checks at the receiving dealer or at our
            counter per applicable law.
          </p>
          <p>
            Once a firearm transfer is completed and the 4473 process is finished (or once you
            take possession where law allows), the sale is final except as required by law or a
            written warranty from the manufacturer.
          </p>
          <p>
            Ammunition and other regulated commodities are also generally final sale; see our
            Returns policy for carve-outs such as lawful defects or fulfillment errors attributable
            to Modular Gunworks.
          </p>

          <h2>Used, estate, auction, or consignment items</h2>
          <p>
            When listed, items may include descriptive text and imagery. Inspect with your
            transferring FFL where applicable.
          </p>
          <p>
            Except where expressly prohibited by law, all firearm and ammunition sales remain
            final notwithstanding cosmetic variances.
          </p>

          <h2 id="mgw-shipping-failed-transfers">Shipping &amp; failed transfers</h2>
          <p>Risk of loss follows carrier rules once the package leaves our control unless otherwise mandated by law.</p>
          <p>
            If we ship to another FFL and the buyer fails a background check, abandons the
            transfer, or refuses lawful documentation, buyer is responsible for return freight, any
            storage fees permitted by policy, and, where allowable, up to a 15% restocking fee on
            the firearm&apos;s purchase price.
          </p>
          <p>
            Outbound shipping charges are typically non-refundable once the package ships except
            when we materially erred.
          </p>
          <p>
            Compliance resources: read our <Link href="/state-restrictions">state restrictions summary</Link> and{" "}
            <Link href="/returns">returns policy</Link>.
          </p>

          <h2>Limitation of liability</h2>
          <p>
            To the maximum extent permitted by applicable law Modular Gunworks is not liable for
            indirect, incidental, special, consequential, or punitive damages. Some jurisdictions
            do not allow certain limitations; in those cases our liability is limited to the
            fullest extent still enforceable.
          </p>

          <p>
            <Link href="/contact">Contact us with questions about these Terms.</Link>
          </p>
        </div>
      </main>
    </SiteShell>
  );
}
