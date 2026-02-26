import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
        images: { orderBy: { sortOrder: "asc" } },
        reviews: {
          include: { user: { select: { name: true, image: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "ไม่พบสินค้า" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Product GET Error:", error);
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
      name,
      description,
      price,
      stock,
      categoryId,
      isActive,
      isFeatured,
      images,
    } = body;

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        description,
        price,
        stock,
        categoryId: categoryId || null,
        isActive,
        isFeatured,
      },
      include: {
        category: { select: { id: true, name: true } },
        images: true,
      },
    });

    if (images) {
      await prisma.productImage.deleteMany({ where: { productId: id } });
      if (images.length > 0) {
        await prisma.productImage.createMany({
          data: images.map((img: { url: string; alt?: string }, i: number) => ({
            productId: id,
            url: img.url,
            alt: img.alt ?? name,
            sortOrder: i,
          })),
        });
      }
    }

    const updated = await prisma.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
        images: { orderBy: { sortOrder: "asc" } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Product PUT Error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการแก้ไขสินค้า" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { id } = await params;
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ message: "ลบสินค้าสำเร็จ" });
  } catch (error) {
    console.error("Product DELETE Error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการลบสินค้า" },
      { status: 500 },
    );
  }
}
