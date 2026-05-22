import Link from "next/link";
import { SiteShell } from "@/components/SiteShell";
import { STORE } from "@/lib/store";

const MAPS_SRC = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_URL || "";

export const metadata = {
  title: "Contact Us",
  description:
    "Contact Modular Gunworks LLC in Huntsville, Alabama — phone, email, hours, map, FFL transfers, and customer support.",
};

export default function ContactPage() {
  return (
    <SiteShell>
      <main>
        <section className="contact-hero">
          <h1 className="page-title">Contact Us</h1>
          <p className="contact-hero-subtitle">
            Questions about orders, transfers, or services? Call, email, or visit our
            Huntsville-area FFL storefront.
          </p>
        </section>

        <div className="contact-wrapper">
          <div className="contact-info contact-card">
            <h2>Get in Touch</h2>
            <p className="contact-intro">
              We are happy to help locals and online buyers using us as a receiving FFL.
            </p>
            <div className="info-item">
              <span className="info-icon">
                <i className="fas fa-phone" />
              </span>
              <div className="info-content">
                <h3>Phone</h3>
                <p>
                  <a href={`tel:${STORE.phoneTel}`}>{STORE.phone}</a>
                </p>
              </div>
            </div>
            <div className="info-item">
              <span className="info-icon">
                <i className="fas fa-envelope" />
              </span>
              <div className="info-content">
                <h3>Email</h3>
                <p>
                  <a href={`mailto:${STORE.email}`}>{STORE.email}</a>
                </p>
              </div>
            </div>
            <div className="info-item">
              <span className="info-icon">
                <i className="fas fa-map-marker-alt" />
              </span>
              <div className="info-content">
                <h3>Location</h3>
                <p className="contact-address-block">{STORE.addressDisplay}</p>
                <p>
                  <strong>Hours:</strong> {STORE.hours}
                </p>
                <p className="contact-ffl-link">
                  <Link href="/ffl-transfers">FFL transfer info &amp; fees →</Link>
                </p>
              </div>
            </div>
          </div>

          <div className="contact-form-section contact-card">
            <h2>Send a Message</h2>
            <p className="contact-intro">
              Email us directly and we will respond as soon as possible during business hours.
            </p>
            <p>
              <a
                className="cta-link"
                href={`mailto:${STORE.email}?subject=${encodeURIComponent("Website inquiry")}`}
              >
                Email {STORE.email}
              </a>
            </p>
            <p className="request-service-note">
              Full contact form (Contact Form 7) will connect in a later phase. Call{" "}
              <a href={`tel:${STORE.phoneTel}`}>{STORE.phone}</a> for urgent transfer or order
              questions.
            </p>
          </div>
        </div>

        {MAPS_SRC ? (
          <section className="contact-map-section" aria-label="Map">
            <div className="mgw-map-embed">
              <iframe
                src={MAPS_SRC}
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Modular Gunworks map"
              />
            </div>
            <p className="contact-map-note">
              Call ahead if you need suite, gate, or after-hours instructions.
            </p>
          </section>
        ) : null}
      </main>
    </SiteShell>
  );
}
