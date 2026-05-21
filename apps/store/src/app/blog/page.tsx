import { SiteShell } from "@/components/SiteShell";

export const metadata = { title: "Blog" };

export default function BlogPage() {
  return (
    <SiteShell>
      <main className="content-section">
        <h1 className="page-title">Blog</h1>
        <p>WordPress blog posts can be migrated or linked in a later phase.</p>
      </main>
    </SiteShell>
  );
}
