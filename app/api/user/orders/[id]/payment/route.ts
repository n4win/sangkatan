import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH - อัปโหลดสลิปการชำระเงิน
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: orderId } = await params;

  try {
    const { slipImage } = await req.json();

    // === Validate slipImage path ===
    if (
      !slipImage ||
      typeof slipImage !== "string" ||
      !slipImage.startsWith("/uploads/slip/") ||
      slipImage.includes("..")
    ) {
      return NextResponse.json(
        { error: "ข้อมูลสลิปไม่ถูกต้อง" },
        { status: 400 },
      );
    }

    // ตรวจสอบว่า order เป็นของ user นี้
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: session.user.id },
      include: { payment: true },
    });

    if (!order) {
      return NextResponse.json({ error: "ไม่พบคำสั่งซื้อ" }, { status: 404 });
    }

    if (!order.payment) {
      return NextResponse.json(
        { error: "ไม่พบข้อมูลการชำระเงิน" },
        { status: 400 },
      );
    }

    // อนุญาตเฉพาะ order ที่ยังรอชำระเงิน (PENDING) เท่านั้น
    if (order.status !== "PENDING") {
      return NextResponse.json(
        {
          error:
            "ไม่สามารถอัปโหลดสลิปได้ — คำสั่งซื้อนี้ไม่อยู่ในสถานะรอชำระเงิน",
        },
        { status: 400 },
      );
    }

    if (order.payment.status === "COMPLETED") {
      return NextResponse.json(
        { error: "การชำระเงินได้รับการยืนยันแล้ว" },
        { status: 400 },
      );
    }

    // อัปเดตสลิปและเปลี่ยนสถานะ order เป็น PAID (รอ admin ตรวจสอบ)
    await prisma.$transaction([
      prisma.payment.update({
        where: { id: order.payment.id },
        data: {
          slipImage,
          paidAt: new Date(),
        },
      }),
      prisma.order.update({
        where: { id: orderId },
        data: { status: "PAID" },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Payment Upload Error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการอัปโหลดสลิป" },
      { status: 500 },
    );
  }
}
