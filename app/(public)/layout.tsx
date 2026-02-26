import { Navbar } from "@/components/public/navbar";
import { Footer } from "@/components/public/footer";
import { OrganizationJsonLd } from "@/components/public/json-ld";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
    >
      <OrganizationJsonLd />
      <Navbar />
      <main style={{ flex: 1 }}>{children}</main>
      <Footer />
    </div>
  );
}
