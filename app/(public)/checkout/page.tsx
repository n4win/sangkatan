import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutContent } from "@/components/public/checkout-content";

export const metadata: Metadata = {
  title: "สั่งซื้อสินค้า",
  description: "ยืนยันการสั่งซื้อสินค้า - ศูนย์ร่มโพธิ์ร่มไทรวัยดอกลำดวน",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutContent />
    </Suspense>
  );
}
