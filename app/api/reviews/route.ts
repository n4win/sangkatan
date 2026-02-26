import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - ดึงรีวิวของสินค้า
export async function GET(req: NextRequest) {
  const productId = req.nextUrl.searchParams.get("productId");

  if (!productId) {
    return NextResponse.json({ error: "productId required" }, { status: 400 });
  }

  const reviews = await prisma.review.findMany({
    where: { productId },
    include: { user: { select: { name: true, image: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(reviews);
}

// POST - สร้างรีวิว (เฉพาะผู้ที่สั่งซื้อสินค้าแล้วเท่านั้น)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { productId, rating, comment } = await req.json();

  if (!productId || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  // ตรวจสอบว่าผู้ใช้ได้สั่งซื้อสินค้านี้แล้วหรือไม่ (สถานะ DELIVERED)
  const hasPurchased = await prisma.orderItem.findFirst({
    where: {
      productId,
      order: {
        userId: session.user.id,
        status: "DELIVERED",
      },
    },
  });

  if (!hasPurchased) {
    return NextResponse.json(
      { error: "คุณต้องสั่งซื้อและได้รับสินค้าแล้วจึงจะรีวิวได้" },
      { status: 403 }
    );
  }

  // ตรวจสอบว่าเคยรีวิวสินค้านี้แล้วหรือไม่
  const existingReview = await prisma.review.findUnique({
    where: { userId_productId: { userId: session.user.id, productId } },
  });

  if (existingReview) {
    // อัปเดตรีวิวเดิม
    const updated = await prisma.review.update({
      where: { id: existingReview.id },
      data: { rating, comment: comment || null },
      include: { user: { select: { name: true, image: true } } },
    });
    return NextResponse.json(updated);
  }

  // สร้างรีวิวใหม่
  const review = await prisma.review.create({
    data: {
      userId: session.user.id,
      productId,
      rating,
      comment: comment || null,
    },
    include: { user: { select: { name: true, image: true } } },
  });

  return NextResponse.json(review, { status: 201 });
}
