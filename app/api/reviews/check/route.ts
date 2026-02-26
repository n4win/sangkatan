import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - ตรวจสอบว่าผู้ใช้สามารถรีวิวสินค้านี้ได้หรือไม่
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ canReview: false, hasReviewed: false });
  }

  const productId = req.nextUrl.searchParams.get("productId");
  if (!productId) {
    return NextResponse.json({ error: "productId required" }, { status: 400 });
  }

  // ตรวจสอบว่าสั่งซื้อและได้รับสินค้าแล้ว
  const hasPurchased = await prisma.orderItem.findFirst({
    where: {
      productId,
      order: {
        userId: session.user.id,
        status: "DELIVERED",
      },
    },
  });

  // ตรวจสอบว่าเคยรีวิวแล้วหรือไม่
  const existingReview = await prisma.review.findUnique({
    where: { userId_productId: { userId: session.user.id, productId } },
  });

  return NextResponse.json({
    canReview: !!hasPurchased,
    hasReviewed: !!existingReview,
    existingReview: existingReview
      ? { rating: existingReview.rating, comment: existingReview.comment }
      : null,
  });
}
