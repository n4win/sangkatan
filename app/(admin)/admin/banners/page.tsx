import type { Metadata } from "next";
import { BannersContent } from "@/components/admin/banners/banners-content";

export const metadata: Metadata = {
  title: "จัดการแบนเนอร์",
};

export default function AdminBannersPage() {
  return <BannersContent />;
}
