import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "10");
    const search = searchParams.get("search") ?? "";
    const categoryId = searchParams.get("categoryId") ?? "";

    const where = {
      ...(search && {
        OR: [
          { name: { contains: search } },
          { description: { contains: search } },
        ],
      }),
      ...(categoryId && { categoryId }),
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true } },
          images: { orderBy: { sortOrder: "asc" }, take: 1 },
          _count: {
            select: {
              reviews: true,
              orderItems: {
                where: {
                  order: { status: { not: "CANCELLED" } },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Products GET Error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
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

    const slug = name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w\-ก-๙]+/g, "")
      .concat("-", Date.now().toString(36));

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
        stock: stock ?? 0,
        slug,
        categoryId: categoryId || null,
        isActive: isActive ?? true,
        isFeatured: isFeatured ?? false,
        images: images?.length
          ? {
              create: images.map(
                (img: { url: string; alt?: string }, i: number) => ({
                  url: img.url,
                  alt: img.alt ?? name,
                  sortOrder: i,
                }),
              ),
            }
          : undefined,
      },
      include: {
        category: { select: { id: true, name: true } },
        images: true,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Products POST Error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการสร้างสินค้า" },
      { status: 500 },
    );
  }
}
