import type { Metadata } from "next";
import { ProfileContent } from "@/components/public/profile-content";

export const metadata: Metadata = {
  title: "ข้อมูลของฉัน",
  description: "จัดการข้อมูลส่วนตัว - ศูนย์ร่มโพธิ์ร่มไทรวัยดอกลำดวน",
  robots: { index: false, follow: false },
};

export default function ProfilePage() {
  return <ProfileContent />;
}
