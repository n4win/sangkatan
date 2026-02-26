import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { id } = await params;
    const activity = await prisma.activity.findUnique({
      where: { id },
      include: { images: { orderBy: { sortOrder: "asc" } } },
    });

    if (!activity) {
      return NextResponse.json({ error: "ไม่พบกิจกรรม" }, { status: 404 });
    }

    return NextResponse.json(activity);
  } catch (error) {
    console.error("Activity GET Error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูลกิจกรรม" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { id } = await params;
    const body = await request.json();
    const { title, content, coverImage, isPublished, images } = body;

    const existing = await prisma.activity.findUnique({ where: { id } });

    const activity = await prisma.activity.update({
      where: { id },
      data: {
        title,
        content,
        coverImage: coverImage || null,
        isPublished,
        publishedAt:
          isPublished && !existing?.publishedAt
            ? new Date()
            : existing?.publishedAt,
      },
    });

    if (images) {
      await prisma.activityImage.deleteMany({ where: { activityId: id } });
      if (images.length > 0) {
        await prisma.activityImage.createMany({
          data: images.map(
            (img: { url: string; caption?: string }, i: number) => ({
              activityId: id,
              url: img.url,
              caption: img.caption ?? null,
              sortOrder: i,
            }),
          ),
        });
      }
    }

    const updated = await prisma.activity.findUnique({
      where: { id },
      include: { images: { orderBy: { sortOrder: "asc" } } },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Activity PUT Error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการแก้ไขกิจกรรม" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { id } = await params;
    await prisma.activity.delete({ where: { id } });
    return NextResponse.json({ message: "ลบกิจกรรมสำเร็จ" });
  } catch (error) {
    console.error("Activity DELETE Error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการลบกิจกรรม" },
      { status: 500 },
    );
  }
}
