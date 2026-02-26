import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
        items: {
          include: {
            product: {
              select: { id: true, name: true, images: { take: 1 } },
            },
          },
        },
        payment: true,
        proofImages: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "ไม่พบออเดอร์" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Order GET Error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { id } = await params;
    const body = await request.json();
    const {
      status,
      shippingCarrier,
      trackingNumber,
      proofImages,
      paymentStatus,
    } = body;

    // Build update data dynamically
    const updateData: Record<string, unknown> = {};
    if (status !== undefined) updateData.status = status;
    if (shippingCarrier !== undefined)
      updateData.shippingCarrier = shippingCarrier || null;
    if (trackingNumber !== undefined)
      updateData.trackingNumber = trackingNumber || null;

    const order = await prisma.$transaction(async (tx) => {
      // 0. Fetch existing order for status check + stock restore
      const existingOrder = await tx.order.findUnique({
        where: { id },
        include: { payment: true, items: true },
      });

      if (!existingOrder) {
        throw new Error("ไม่พบออเดอร์");
      }

      // 1. Update payment status if provided
      if (paymentStatus !== undefined) {
        if (existingOrder.payment) {
          await tx.payment.update({
            where: { id: existingOrder.payment.id },
            data: {
              status: paymentStatus,
              paidAt:
                paymentStatus === "COMPLETED"
                  ? new Date()
                  : existingOrder.payment.paidAt,
            },
          });
        }
      }

      // 1.5 Restore stock if admin cancels order (and it wasn't already cancelled)
      if (status === "CANCELLED" && existingOrder.status !== "CANCELLED") {
        for (const item of existingOrder.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
        // Also mark payment as FAILED
        if (
          existingOrder.payment &&
          existingOrder.payment.status !== "FAILED"
        ) {
          await tx.payment.update({
            where: { id: existingOrder.payment.id },
            data: { status: "FAILED" },
          });
        }
      }

      // 2. Update order fields
      const updated = await tx.order.update({
        where: { id },
        data: updateData,
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: {
            include: { product: { select: { id: true, name: true } } },
          },
          payment: true,
          proofImages: { orderBy: { createdAt: "asc" } },
        },
      });

      // 2. Sync proof images if provided
      if (Array.isArray(proofImages)) {
        // Delete existing proof images
        await tx.orderProofImage.deleteMany({ where: { orderId: id } });
        // Create new ones
        if (proofImages.length > 0) {
          await tx.orderProofImage.createMany({
            data: proofImages.map((img: { url: string; caption?: string }) => ({
              orderId: id,
              url: img.url,
              caption: img.caption || null,
            })),
          });
        }
        // Re-fetch with updated proof images
        return tx.order.findUnique({
          where: { id },
          include: {
            user: { select: { id: true, name: true, email: true } },
            items: {
              include: { product: { select: { id: true, name: true } } },
            },
            payment: true,
            proofImages: { orderBy: { createdAt: "asc" } },
          },
        });
      }

      return updated;
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error("Order PUT Error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการอัปเดตออเดอร์" },
      { status: 500 },
    );
  }
}
