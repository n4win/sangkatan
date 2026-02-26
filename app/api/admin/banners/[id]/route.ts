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
    const { title, image, link, sortOrder, isActive } = body;

    const banner = await prisma.banner.update({
      where: { id },
      data: { title, image, link, sortOrder, isActive },
    });

    return NextResponse.json(banner);
  } catch (error) {
    console.error("Banner PUT Error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการแก้ไขแบนเนอร์" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { id } = await params;
    await prisma.banner.delete({ where: { id } });
    return NextResponse.json({ message: "ลบแบนเนอร์สำเร็จ" });
  } catch (error) {
    console.error("Banner DELETE Error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการลบแบนเนอร์" },
      { status: 500 },
    );
  }
}
