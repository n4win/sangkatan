import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{ itemId: string }>;
}

// PATCH - อัปเดตจำนวนสินค้าในตะกร้า
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { itemId } = await params;
  const { quantity } = await req.json();

  if (!quantity || quantity < 1) {
    return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
  }

  const cartItem = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { cart: true, product: true },
  });

  if (!cartItem || cartItem.cart.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!cartItem.product.isActive) {
    return NextResponse.json(
      { error: "สินค้านี้ถูกปิดการขายแล้ว", currentStock: 0 },
      { status: 400 },
    );
  }

  if (quantity > cartItem.product.stock) {
    return NextResponse.json(
      {
        error: `สินค้าคงเหลือ ${cartItem.product.stock} ชิ้น`,
        currentStock: cartItem.product.stock,
      },
      { status: 400 },
    );
  }

  await prisma.cartItem.update({
    where: { id: itemId },
    data: { quantity },
  });

  return NextResponse.json({ success: true });
}

// DELETE - ลบสินค้าออกจากตะกร้า
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { itemId } = await params;

  const cartItem = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { cart: true },
  });

  if (!cartItem || cartItem.cart.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.cartItem.delete({ where: { id: itemId } });

  return NextResponse.json({ success: true });
}
