import Link from "next/link";
import { SiteShell } from "@/components/SiteShell";

export const metadata = {
  title: "State Restrictions",
  description:
    "State shipping restrictions for firearms and ammunition — Modular Gunworks compliance overview.",
};

export default function StateRestrictionsPage() {
  return (
    <SiteShell>
      <main>
        <h1 className="page-title">State Restrictions</h1>
        <div className="content-section">
          <p>
            Firearms, ammunition, and certain accessories are subject to federal, state, and local
            laws. We cannot ship to states or jurisdictions where such items are prohibited.
          </p>
          <h2>Compliance</h2>
          <p>
            We comply with all applicable federal and state regulations. During checkout, we will
            inform you of any restrictions for your area. Some states require additional
            documentation or have quantity limits.
          </p>
          <h2>Questions</h2>
          <p>
            If you&apos;re unsure about restrictions in your state, <Link href="/contact">contact us</Link> before ordering.
          </p>
        </div>
      </main>
    </SiteShell>
  );
}
