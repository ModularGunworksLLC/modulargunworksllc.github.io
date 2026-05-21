import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader cartCount={0} />
      {children}
      <SiteFooter />
    </>
  );
}
