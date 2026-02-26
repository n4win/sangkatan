import type { Metadata } from "next";
import { ActivitiesContent } from "@/components/admin/activities/activities-content";

export const metadata: Metadata = {
  title: "จัดการกิจกรรม",
};

export default function AdminActivitiesPage() {
  return <ActivitiesContent />;
}
