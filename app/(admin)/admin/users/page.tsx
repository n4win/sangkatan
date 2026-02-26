import type { Metadata } from "next";
import { UsersContent } from "@/components/admin/users/users-content";

export const metadata: Metadata = {
  title: "จัดการผู้ใช้งาน",
};

export default function AdminUsersPage() {
  return <UsersContent />;
}
