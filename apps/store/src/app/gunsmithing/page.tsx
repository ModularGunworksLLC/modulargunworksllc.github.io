import { SiteShell } from "@/components/SiteShell";
import { ServiceRequestModal } from "@/components/ServiceRequestModal";

export const metadata = {
  title: "Basic Firearm Services",
  description:
    "Gunsmithing services in Huntsville, AL at Modular Gunworks — cleaning, mounting, inspections, and more.",
};

export default function GunsmithingPage() {
  return (
    <SiteShell>
      <main>
        <div className="page-hero">
          <div className="icon">
            <i className="fas fa-wrench" />
          </div>
          <h1>Basic Firearm Services</h1>
          <p>
            We offer basic firearm services at competitive prices—cleaning, inspection,
            optics mounting, and simple sight installation. We&apos;re working toward full
            gunsmith certification to expand our services.
          </p>
          <p className="note">
            All work is performed at our Huntsville location. Call or email to schedule.
          </p>
          <span className="badge">
            <i className="fas fa-check-circle" /> Available now
          </span>
        </div>

        <div className="section">
          <h2>Service pricing</h2>
          <table className="price-table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Description</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Field strip &amp; clean</td>
                <td>
                  Basic disassembly, carbon removal, and lubrication for routine
                  maintenance after range use.
                </td>
                <td className="price">$30</td>
              </tr>
              <tr>
                <td>Deep clean</td>
                <td>
                  Full detail strip and ultrasonic cleaning of all components to remove
                  heavy buildup and long-term fouling.
                </td>
                <td className="price">$80</td>
              </tr>
              <tr>
                <td>Basic inspection / function check</td>
                <td>
                  Mechanical safety and reliability assessment, including trigger, safety,
                  and cycle testing.
                </td>
                <td className="price">$25</td>
              </tr>
              <tr>
                <td>Optics mounting &amp; bore sight</td>
                <td>
                  Secure installation of optics using proper torque specs, followed by a
                  mechanical bore sight to get you on paper.
                </td>
                <td className="price">$50</td>
              </tr>
              <tr>
                <td>Simple sight installation</td>
                <td>
                  Professional installation of drop-in aftermarket iron sights using
                  specialized tools to protect your firearm&apos;s finish.
                </td>
                <td className="price">$40</td>
              </tr>
            </tbody>
          </table>
        </div>

        <ServiceRequestModal />
      </main>
    </SiteShell>
  );
}
