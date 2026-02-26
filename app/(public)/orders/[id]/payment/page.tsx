import type { Metadata } from "next";
import { PaymentContent } from "@/components/public/payment-content";

export const metadata: Metadata = {
  title: "ชำระเงิน",
  description: "ชำระเงินสำหรับคำสั่งซื้อ - ศูนย์ร่มโพธิ์ร่มไทรวัยดอกลำดวน",
  robots: { index: false, follow: false },
};

export default async function PaymentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PaymentContent orderId={id} />;
}
