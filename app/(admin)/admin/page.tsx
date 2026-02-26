import type { Metadata } from "next";
import { DashboardContent } from "@/components/admin/dashboard/dashboard-content";

export const metadata: Metadata = {
  title: "แดชบอร์ด",
};

export default function AdminDashboardPage() {
  return <DashboardContent />;
}
