import Link from "next/link";
import { SiteShell } from "@/components/SiteShell";
import { STORE } from "@/lib/store";

export const metadata = {
  title: "Privacy Policy",
  description: "Privacy policy for Modular Gunworks LLC — data use, disclosure, and security.",
};

export default function PrivacyPage() {
  return (
    <SiteShell>
      <main>
        <h1 className="page-title">Privacy Policy</h1>
        <div className="content-section">
          <p>
            <strong>Last Updated: February 2026</strong>
          </p>
          <p>
            Modular Gunworks LLC respects your privacy. This policy explains what we collect,
            how we use it, and whom we disclose it to.
          </p>

          <h2>Information we collect</h2>
          <p>
            Identifiers and contact fields you supply (name, email, mailing address, phone),
            account credentials when you register, transactional data (SKU history, totals),
            payment tokens processed by gateways, firearm transfer records required by
            BATFE/state law, diagnostics from website logs, and correspondence you voluntarily
            send.
          </p>

          <h2>Use of information</h2>
          <p>
            We process data to fulfill orders, verify FFLs, ship packages, deter fraud, provide
            customer care, comply with regulators, defend legal claims, and improve site security.
          </p>

          <h2>Disclosures</h2>
          <p>Modular Gunworks does not sell or rent personally identifiable consumer marketing lists.</p>
          <p>
            We share limited data with service processors who help us operate: payment gateways,
            ecommerce hosting, transactional email carriers, fulfillment partners, auditors,
            firearms distributors, shipping carriers (UPS/FedEx/USPS/etc.), transferring FFLs, and
            lawful requests from governmental authorities—including ATF NFA branch workflows if you
            initiate regulated transfers.
          </p>
          <p>
            As we broaden regulated offerings such as NFA items or SOT services, supplementary forms
            and BATFE-required retention may apply; notice will be refreshed when those launches
            occur.
          </p>

          <h2>Security &amp; retention</h2>
          <p>
            Firearm transaction records maintain statutory retention windows. Electronic safeguards
            follow reasonable industry measures; payments are routed through PCI-DSS-aligned
            processors.
          </p>

          <h2>Marketing &amp; communications</h2>
          <p>
            Signing up for newsletters implies consent under applicable marketing law; unsubscribe
            links accompany each campaign.
          </p>

          <h2>Rights &amp; contact</h2>
          <p>
            Residents in states with supplemental privacy statutes may possess additional notices
            or rights—we will comply when jurisdictional thresholds are met.
          </p>
          <p>
            <Link href="/contact">Privacy questions?</Link> {STORE.phone}
          </p>
        </div>
      </main>
    </SiteShell>
  );
}
