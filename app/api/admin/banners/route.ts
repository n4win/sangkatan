import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const banners = await prisma.banner.findMany({
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json(banners);
  } catch (error) {
    console.error("Banners GET Error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูลแบนเนอร์" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();
    const { title, image, link, sortOrder, isActive } = body;

    const banner = await prisma.banner.create({
      data: {
        title,
        image,
        link,
        sortOrder: sortOrder ?? 0,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json(banner, { status: 201 });
  } catch (error) {
    console.error("Banners POST Error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการสร้างแบนเนอร์" },
      { status: 500 },
    );
  }
}
