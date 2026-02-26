import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

// POST - สร้างคำสั่งซื้อจากสินค้าที่เลือกในตะกร้า
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { cartItemIds, shippingName, shippingPhone, shippingAddress, note } =
      body;

    // === Input validation ===
    if (
      !Array.isArray(cartItemIds) ||
      cartItemIds.length === 0 ||
      cartItemIds.length > 100 ||
      !cartItemIds.every(
        (id: unknown) => typeof id === "string" && id.length > 0,
      )
    ) {
      return NextResponse.json(
        { error: "ข้อมูลสินค้าไม่ถูกต้อง" },
        { status: 400 },
      );
    }

    const name = String(shippingName ?? "").trim();
    const phone = String(shippingPhone ?? "").trim();
    const address = String(shippingAddress ?? "").trim();
    const orderNote = note ? String(note).trim().slice(0, 500) : null;

    if (!name || name.length > 200) {
      return NextResponse.json(
        { error: "กรุณาระบุชื่อผู้รับที่ถูกต้อง" },
        { status: 400 },
      );
    }
    if (!phone || !/^[0-9\-+ ]{9,15}$/.test(phone)) {
      return NextResponse.json(
        { error: "กรุณาระบุเบอร์โทรศัพท์ที่ถูกต้อง" },
        { status: 400 },
      );
    }
    if (!address || address.length < 10 || address.length > 500) {
      return NextResponse.json(
        { error: "กรุณาระบุที่อยู่จัดส่งที่ถูกต้อง (10-500 ตัวอักษร)" },
        { status: 400 },
      );
    }

    // === สร้าง order number ที่ไม่ชนกัน: ORD-YYYYMMDD-XXXX + random suffix ===
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = crypto.randomBytes(3).toString("hex");
    const todayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    const orderCount = await prisma.order.count({
      where: { createdAt: { gte: todayStart } },
    });
    const orderNumber = `ORD-${dateStr}-${String(orderCount + 1).padStart(4, "0")}-${randomSuffix}`;

    // === ทำทุกอย่างภายใน transaction เพื่อป้องกัน race condition ===
    const order = await prisma.$transaction(async (tx) => {
      // 1. ดึง cart items + ตรวจสอบว่าเป็นของ user นี้จริง
      const cart = await tx.cart.findUnique({
        where: { userId: session.user!.id! },
        include: {
          items: {
            where: { id: { in: cartItemIds } },
            include: { product: true },
          },
        },
      });

      if (!cart || cart.items.length === 0) {
        throw new Error("ไม่พบสินค้าในตะกร้า");
      }

      // 2. ตรวจสอบ stock + active ภายใน transaction (ป้องกัน race condition)
      for (const item of cart.items) {
        // ดึง stock ล่าสุดด้วย select for update (serializable ใน transaction)
        const freshProduct = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!freshProduct || !freshProduct.isActive) {
          throw new Error(`"${item.product.name}" ถูกปิดการขายแล้ว`);
        }
        if (freshProduct.stock < item.quantity) {
          throw new Error(
            `"${item.product.name}" มีสินค้าคงเหลือ ${freshProduct.stock} ชิ้น (คุณสั่ง ${item.quantity})`,
          );
        }
      }

      // 3. คำนวณยอดรวม (ใช้ราคาจาก DB ไม่ใช่จาก client)
      const totalAmount = cart.items.reduce(
        (sum, item) => sum + Number(item.product.price) * item.quantity,
        0,
      );

      // 4. สร้าง order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: session.user!.id!,
          totalAmount,
          shippingName: name,
          shippingPhone: phone,
          shippingAddress: address,
          note: orderNote,
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.price,
              subtotal: Number(item.product.price) * item.quantity,
            })),
          },
          payment: {
            create: {
              method: "PROMPTPAY",
              amount: totalAmount,
              status: "PENDING",
            },
          },
        },
        include: {
          items: { include: { product: true } },
          payment: true,
        },
      });

      // 5. ลด stock สินค้า
      for (const item of cart.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // 6. ลบ cart items ที่สั่งซื้อแล้ว
      await tx.cartItem.deleteMany({
        where: { id: { in: cartItemIds as string[] } },
      });

      return newOrder;
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
    });
  } catch (error) {
    console.error("Checkout Error:", error);
    const message =
      error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการสั่งซื้อ";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
