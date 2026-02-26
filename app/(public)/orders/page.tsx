import type { Metadata } from "next";
import { OrdersContent } from "@/components/public/orders-content";

export const metadata: Metadata = {
  title: "การซื้อของฉัน",
  description: "ประวัติการสั่งซื้อของคุณ - ศูนย์ร่มโพธิ์ร่มไทรวัยดอกลำดวน",
  robots: { index: false, follow: false },
};

export default function OrdersPage() {
  return <OrdersContent />;
}
