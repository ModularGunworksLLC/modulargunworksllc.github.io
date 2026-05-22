"use client";

import { useEffect, useId, useState } from "react";
import { STORE } from "@/lib/store";

type Props = {
  buttonLabel?: string;
  modalTitle?: string;
  helpText?: string;
};

export function ServiceRequestModal({
  buttonLabel = "Request service",
  modalTitle = "Request Service",
  helpText = "Fill out this quick form and we will follow up to confirm scheduling.",
}: Props) {
  const [open, setOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (!open) {
      document.body.style.overflow = "";
      return;
    }
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") || "");
    const email = String(fd.get("email") || "");
    const message = String(fd.get("message") || "");
    const phone = String(fd.get("phone") || "");

    setSubmitting(true);
    setStatus("idle");
    try {
      const res = await fetch("/api/service-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, message }),
      });
      if (res.ok) {
        setStatus("ok");
        e.currentTarget.reset();
        return;
      }
      setStatus("error");
    } catch {
      setStatus("error");
    } finally {
      setSubmitting(false);
    }

    const subject = encodeURIComponent(`Service request from ${name}`);
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\n\n${message}`,
    );
    window.location.href = `mailto:${STORE.email}?subject=${subject}&body=${body}`;
  }

  return (
    <>
      <p>
        <button type="button" className="cta-link" onClick={() => setOpen(true)}>
          {buttonLabel}
        </button>
      </p>

      <div
        className={`service-modal-backdrop${open ? " is-open" : ""}`}
        aria-hidden={!open}
        onClick={(e) => {
          if (e.target === e.currentTarget) setOpen(false);
        }}
      >
        <div
          className="service-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <button
            type="button"
            className="service-modal-close"
            aria-label="Close request form"
            onClick={() => setOpen(false)}
          >
            ×
          </button>
          <h2 id={titleId}>{modalTitle}</h2>
          <p className="service-modal-help">{helpText}</p>
          <form className="service-request-form" onSubmit={handleSubmit}>
            <label htmlFor="sr-name">Name</label>
            <input id="sr-name" name="name" type="text" required autoComplete="name" />
            <label htmlFor="sr-email">Email</label>
            <input id="sr-email" name="email" type="email" required autoComplete="email" />
            <label htmlFor="sr-phone">Phone (optional)</label>
            <input id="sr-phone" name="phone" type="tel" autoComplete="tel" />
            <label htmlFor="sr-message">Message</label>
            <textarea id="sr-message" name="message" required />
            {status === "ok" ? (
              <p className="request-service-note" role="status">
                Request sent — we will follow up soon.
              </p>
            ) : null}
            {status === "error" ? (
              <p className="request-service-note" role="alert">
                Online submit failed; opening email as backup…
              </p>
            ) : null}
            <p style={{ marginTop: "1rem" }}>
              <button type="submit" className="cta-link" disabled={submitting}>
                {submitting ? "Sending…" : "Submit request"}
              </button>
            </p>
            <p className="request-service-note">
              Or call <a href={`tel:${STORE.phoneTel}`}>{STORE.phone}</a>.
            </p>
          </form>
        </div>
      </div>
    </>
  );
}
