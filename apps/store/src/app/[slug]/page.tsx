import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/SiteShell";
import { allContentSlugs, getContentPage } from "@/lib/content-pages";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return allContentSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = getContentPage(slug);
  if (!page) return {};
  return { title: page.title, description: page.description };
}

export default async function ContentPage({ params }: Props) {
  const { slug } = await params;
  const page = getContentPage(slug);
  if (!page) notFound();

  return (
    <SiteShell>
      <main>
        <h1 className="page-title">{page.title}</h1>
        <div
          className="content-section"
          dangerouslySetInnerHTML={{ __html: page.body }}
        />
      </main>
    </SiteShell>
  );
}
