/** Shown on Vercel preview until production DNS cutover. */
export function PreviewBanner() {
  if (process.env.NEXT_PUBLIC_HIDE_PREVIEW_BANNER === "1") return null;
  const live = process.env.NEXT_PUBLIC_LIVE_STORE_URL || "https://www.modulargunworks.com";
  return (
    <div
      role="status"
      style={{
        background: "#2d3748",
        color: "#fff",
        padding: "0.5rem 1rem",
        textAlign: "center",
        fontSize: "0.875rem",
        borderBottom: "2px solid var(--color-primary, #c4552a)",
      }}
    >
      Preview build — production store still at{" "}
      <a href={live} style={{ color: "#fbd38d" }}>
        modulargunworks.com
      </a>
      . Catalog & checkout wiring in progress.
    </div>
  );
}
