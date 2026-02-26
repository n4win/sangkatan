import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const categories = await prisma.category.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Categories GET Error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();
    const { name, description, image, isActive } = body;

    const slug = name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w\-ก-๙]+/g, "")
      .concat("-", Date.now().toString(36));

    const category = await prisma.category.create({
      data: { name, description, image, slug, isActive: isActive ?? true },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Categories POST Error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการสร้างหมวดหมู่" },
      { status: 500 },
    );
  }
}
