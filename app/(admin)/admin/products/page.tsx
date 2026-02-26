import type { Metadata } from "next";
import { ProductsContent } from "@/components/admin/products/products-content";

export const metadata: Metadata = {
  title: "จัดการสินค้า",
};

export default function AdminProductsPage() {
  return <ProductsContent />;
}
