import type { Metadata } from "next";
import { CartContent } from "@/components/public/cart-content";

export const metadata: Metadata = {
  title: "ตะกร้าสินค้า",
  description: "ตะกร้าสินค้าของคุณ - ศูนย์ร่มโพธิ์ร่มไทรวัยดอกลำดวน",
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return <CartContent />;
}
