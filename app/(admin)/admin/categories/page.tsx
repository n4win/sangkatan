import type { Metadata } from "next";
import { CategoriesContent } from "@/components/admin/categories/categories-content";

export const metadata: Metadata = {
  title: "จัดการหมวดหมู่",
};

export default function AdminCategoriesPage() {
  return <CategoriesContent />;
}
