import { Suspense } from "react";
import type { Metadata } from "next";
import { SignInContent } from "@/components/auth/signin-content";

export const metadata: Metadata = {
  title: "เข้าสู่ระบบ",
};

export default function SignInPage() {
  return (
    <Suspense>
      <SignInContent />
    </Suspense>
  );
}
