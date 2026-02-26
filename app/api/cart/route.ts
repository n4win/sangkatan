import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - ดึงข้อมูลตะกร้าสินค้า + ตรวจสอบ stock จริง
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cart = await prisma.cart.findUnique({
    where: { userId: session.user.id },
    include: {
      items: {
        include: {
          product: {
            include: { images: { take: 1, orderBy: { sortOrder: "asc" } } },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!cart) return NextResponse.json(null);

  // ตรวจสอบ stock จริงและปรับจำนวนอัตโนมัติ
  const warnings: string[] = [];

  for (const item of cart.items) {
    const { product } = item;

    // สินค้าถูกปิดการขาย
    if (!product.isActive) {
      warnings.push(`"${product.name}" ถูกปิดการขายแล้ว`);
      continue;
    }

    // สินค้าหมด stock
    if (product.stock === 0) {
      warnings.push(`"${product.name}" สินค้าหมด`);
      continue;
    }

    // จำนวนในตะกร้าเกิน stock จริง → ปรับลงอัตโนมัติ
    if (item.quantity > product.stock) {
      await prisma.cartItem.update({
        where: { id: item.id },
        data: { quantity: product.stock },
      });
      item.quantity = product.stock;
      warnings.push(
        `"${product.name}" ปรับจำนวนเป็น ${product.stock} (สินค้าคงเหลือไม่พอ)`,
      );
    }
  }

  return NextResponse.json({ ...cart, warnings });
}

// POST - เพิ่มสินค้าลงตะกร้า
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { productId, quantity = 1 } = await req.json();

  if (!productId || quantity < 1) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  // ตรวจสอบสินค้า
  const product = await prisma.product.findUnique({
    where: { id: productId, isActive: true },
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  if (product.stock < quantity) {
    return NextResponse.json({ error: "Insufficient stock" }, { status: 400 });
  }

  // สร้างหรือดึงตะกร้า
  const cart = await prisma.cart.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id },
    update: {},
  });

  // เพิ่มหรืออัปเดตสินค้าในตะกร้า
  const existingItem = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId } },
  });

  if (existingItem) {
    const newQty = existingItem.quantity + quantity;
    if (newQty > product.stock) {
      return NextResponse.json(
        { error: "Insufficient stock" },
        { status: 400 },
      );
    }
    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: newQty },
    });
  } else {
    await prisma.cartItem.create({
      data: { cartId: cart.id, productId, quantity },
    });
  }

  // ดึงจำนวนสินค้าทั้งหมดในตะกร้า
  const totalItems = await prisma.cartItem.aggregate({
    where: { cartId: cart.id },
    _sum: { quantity: true },
  });

  return NextResponse.json({
    success: true,
    totalItems: totalItems._sum.quantity ?? 0,
  });
}
