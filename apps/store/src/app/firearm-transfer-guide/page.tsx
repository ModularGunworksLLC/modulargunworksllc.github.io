import Link from "next/link";
import { SiteShell } from "@/components/SiteShell";

export const metadata = {
  title: "Firearm Transfer Guide",
  description:
    "How firearm FFL transfers work when you buy online — Modular Gunworks Huntsville guide.",
};

export default function FirearmTransferGuidePage() {
  return (
    <SiteShell>
      <main>
        <h1 className="page-title">Firearm Transfer Guide</h1>
        <div className="content-section">
          <p>
            When you purchase a firearm from an out-of-state dealer or online, it must be
            transferred through a licensed FFL (Federal Firearms Licensee) in your state.
          </p>
          <h2>How It Works</h2>
          <ol>
            <li>
              Order your firearm online and have it shipped to Modular Gunworks LLC (or another
              FFL of your choice).
            </li>
            <li>We receive the firearm and contact you when it arrives.</li>
            <li>
              You come to our Huntsville location with a valid ID to complete the transfer and
              background check.
            </li>
            <li>Once approved, you take possession of your firearm.</li>
          </ol>
          <h2>Requirements</h2>
          <p>
            You must be 21+ for handguns, 18+ for rifles/shotguns (or 21+ per state law). You must
            pass a federal background check (NICS) and meet all eligibility requirements.
          </p>
          <p>
            Once your Form 4473 is completed and you take possession at our counter, the firearm
            sale is final except where law requires otherwise—review our{" "}
            <Link href="/returns">Returns</Link> summary before completing paperwork.
          </p>
          <p>
            <Link href="/ffl-transfers">View our FFL transfer fees and details</Link>
          </p>
        </div>
      </main>
    </SiteShell>
  );
}
