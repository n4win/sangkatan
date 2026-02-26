import type { Metadata } from "next";
import { OrdersContent } from "@/components/admin/orders/orders-content";

export const metadata: Metadata = {
  title: "จัดการออเดอร์",
};

export default function AdminOrdersPage() {
  return <OrdersContent />;
}
