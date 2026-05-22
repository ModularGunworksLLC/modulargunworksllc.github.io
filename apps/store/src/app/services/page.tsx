import Link from "next/link";
import { SiteShell } from "@/components/SiteShell";

export const metadata = {
  title: "Our Services",
  description:
    "Gunsmithing, FFL transfer services, and counter support at Modular Gunworks in Huntsville, Alabama.",
};

export default function ServicesPage() {
  return (
    <SiteShell>
      <main>
        <h1 className="page-title">Our Services</h1>
        <div className="services-grid">
          <div className="service-card">
            <h2>
              <i className="fas fa-wrench" /> Gunsmithing &amp; Basic Services
            </h2>
            <p>
              Cleaning (field strip &amp; deep clean), inspection and function checks,
              optics mounting and bore sight, and simple sight installation. We keep your
              firearms in top condition and are working toward full gunsmith certification
              to expand what we can do.
            </p>
            <Link href="/gunsmithing" className="service-cta">
              See pricing &amp; details
            </Link>
          </div>
          <div className="service-card">
            <h2>
              <i className="fas fa-file-alt" /> FFL Transfers
            </h2>
            <p>
              We are a licensed FFL and offer professional transfer services for firearms
              purchased online or from out-of-state sellers. We handle the compliance
              paperwork so your firearms are transferred legally and safely.
            </p>
            <Link href="/ffl-transfers" className="service-cta">
              Transfer info &amp; fees
            </Link>
          </div>
        </div>
        <div className="services-contact">
          <p>
            Ready to book? Choose a service above, then use the Request button on that
            service page. For non-service questions, <Link href="/contact">contact us</Link>
            .
          </p>
        </div>
      </main>
    </SiteShell>
  );
}
