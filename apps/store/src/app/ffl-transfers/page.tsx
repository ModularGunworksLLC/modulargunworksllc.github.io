import Link from "next/link";
import { SiteShell } from "@/components/SiteShell";
import { ServiceRequestModal } from "@/components/ServiceRequestModal";
import { STORE } from "@/lib/store";

const FFL_PDF = process.env.NEXT_PUBLIC_FFL_PDF_URL || "";

export const metadata = {
  title: "FFL Transfers",
  description:
    "FFL transfers in Huntsville, AL — fees, pickup process, and how to ship online purchases to Modular Gunworks.",
};

export default function FflTransfersPage() {
  return (
    <SiteShell>
      <main>
        <div className="page-hero ffl-hero">
          <div className="icon">
            <i className="fas fa-file-alt" />
          </div>
          <h1>FFL Transfers</h1>
          <p>
            Modular Gunworks LLC is a licensed Federal Firearms Licensee (FFL) in
            Huntsville, Alabama—your receiving dealer for compliant online orders and
            out-of-state shipments.
          </p>
          <span className="badge">
            <i className="fas fa-check-circle" /> Now accepting transfers
          </span>
        </div>

        <div className="section ffl-nap-box">
          <h2>
            <i className="fas fa-map-pin" /> Ship firearms here
          </h2>
          <p className="ffl-nap-lines">{STORE.addressDisplay}</p>
          <p className="ffl-nap-meta">
            Phone: <a href={`tel:${STORE.phoneTel}`}>{STORE.phone}</a> · Hours: {STORE.hours}
          </p>
          <p className="ffl-nap-help">
            Confirm the legal business name on your retailer&apos;s FFL selector matches our
            license. Upload our license file below for their records when available.
          </p>
        </div>

        {FFL_PDF ? (
          <p>
            <a className="cta-link" href={FFL_PDF} target="_blank" rel="noopener noreferrer">
              Download our FFL license (PDF)
            </a>
          </p>
        ) : null}

        <div className="section pricing-box">
          <h2>
            <i className="fas fa-tag" /> Transfer fees
          </h2>
          <p className="price-line">$20 — first firearm</p>
          <p className="price-line">$10 — each additional firearm (same transaction)</p>
          <p className="price-note">
            The $10 rate applies only when multiple firearms are transferred together.
          </p>
        </div>

        <div className="section">
          <h2>How it works</h2>
          <ul>
            <li>
              Use our FFL information when you checkout with your online seller so the
              package routes to Modular Gunworks LLC.
            </li>
            <li>We inspect the shipment, log it, and notify you when it is ready for pickup.</li>
            <li>
              Bring valid government-issued ID; complete the Form 4473 and background check
              required by law.
            </li>
            <li>Pay the transfer fee at pickup before we release the firearm.</li>
          </ul>
        </div>

        <div className="section">
          <h2>Common questions</h2>
          <div className="ffl-faq">
            <div className="ffl-faq-item">
              <h3>How do I list Modular Gunworks as my receiving FFL?</h3>
              <p>
                During online checkout choose “FFL transfer,” search for Modular Gunworks LLC,
                and upload our license if the seller requests it. When in doubt, email us the
                order confirmation so we can watch for the tracking number.
              </p>
            </div>
            <div className="ffl-faq-item">
              <h3>How long do transfers take in Huntsville?</h3>
              <p>
                Carrier transit times vary. After we log your firearm we contact you the same
                business day whenever possible to schedule pickup and complete NICS
                requirements.
              </p>
            </div>
            <div className="ffl-faq-item">
              <h3>What if my background check is delayed or denied?</h3>
              <p>
                We follow every federal and Alabama procedure. If a transfer cannot be
                completed, storage and return-shipping rules in our Terms &amp; Returns may
                apply—especially for shipments we forwarded to another FFL on your behalf.
              </p>
            </div>
            <div className="ffl-faq-item">
              <h3>Can I transfer multiple firearms at once?</h3>
              <p>
                Yes. Additional guns within the same coordinated transaction qualify for the
                discounted add-on fee posted above.
              </p>
            </div>
          </div>
        </div>

        <div className="section">
          <h2>What you need</h2>
          <p>
            Valid government-issued photo ID and legal eligibility to possess firearms.
            Alabama residents may complete transfers at our location. Out-of-state buyers must
            coordinate shipment to an FFL in their state of residence—we cannot transfer across
            state lines except as federal law allows.
          </p>
        </div>

        <ServiceRequestModal
          buttonLabel="Request FFL transfer"
          helpText="Tell us what you ordered and we will confirm next steps."
        />

        <p style={{ marginTop: "1.5rem" }}>
          <Link href="/firearm-transfer-guide">Firearm transfer guide →</Link>
        </p>
      </main>
    </SiteShell>
  );
}
