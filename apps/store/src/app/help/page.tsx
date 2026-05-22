import Link from "next/link";
import { SiteShell } from "@/components/SiteShell";

export const metadata = { title: "Help" };

export default function HelpPage() {
  return (
    <SiteShell>
      <main>
        <h1 className="page-title">Help</h1>
        <p className="page-intro">
          Find answers, track your order, or get in touch. Choose a topic below.
        </p>
        <div className="help-grid">
          <div className="help-card">
            <Link href="/faq">
              <i className="fas fa-question-circle" /> FAQ
            </Link>
            <p>Common questions about orders, shipping, returns, and more.</p>
          </div>
          <div className="help-card">
            <Link href="/contact">
              <i className="fas fa-envelope" /> Contact Us
            </Link>
            <p>Phone, email, or message. We&apos;re here to help.</p>
          </div>
          <div className="help-card">
            <Link href="/order-status">
              <i className="fas fa-truck" /> Order Status
            </Link>
            <p>View your orders and track shipments.</p>
          </div>
          <div className="help-card">
            <Link href="/returns">
              <i className="fas fa-undo" /> Returns
            </Link>
            <p>Our return policy and how to start a return.</p>
          </div>
        </div>
      </main>
    </SiteShell>
  );
}
