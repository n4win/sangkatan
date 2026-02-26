import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, image, isActive } = body;

    const category = await prisma.category.update({
      where: { id },
      data: { name, description, image, isActive },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("Category PUT Error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการแก้ไขหมวดหมู่" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { id } = await params;
    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ message: "ลบหมวดหมู่สำเร็จ" });
  } catch (error) {
    console.error("Category DELETE Error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการลบหมวดหมู่" },
      { status: 500 },
    );
  }
}
