import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH - ยกเลิกคำสั่งซื้อ (เฉพาะ PENDING เท่านั้น) + คืน stock
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
    // ตรวจสอบว่า order เป็นของ user นี้
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: session.user.id },
      include: {
        items: true,
        payment: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "ไม่พบคำสั่งซื้อ" }, { status: 404 });
    }

    // อนุญาตยกเลิกเฉพาะ order ที่ยังไม่ได้ชำระเงิน (PENDING)
    if (order.status !== "PENDING") {
      return NextResponse.json(
        {
          error:
            "ไม่สามารถยกเลิกได้ — เฉพาะคำสั่งซื้อที่ยังไม่ได้ชำระเงินเท่านั้น",
        },
        { status: 400 },
      );
    }

    // ยกเลิก order + คืน stock ใน transaction
    await prisma.$transaction(async (tx) => {
      // 1. เปลี่ยนสถานะ order เป็น CANCELLED
      await tx.order.update({
        where: { id: orderId },
        data: { status: "CANCELLED" },
      });

      // 2. เปลี่ยนสถานะ payment เป็น CANCELLED (ถ้ามี)
      if (order.payment) {
        await tx.payment.update({
          where: { id: order.payment.id },
          data: { status: "FAILED" },
        });
      }

      // 3. คืน stock สินค้าทุกรายการ
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cancel Order Error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการยกเลิกคำสั่งซื้อ" },
      { status: 500 },
    );
  }
}
