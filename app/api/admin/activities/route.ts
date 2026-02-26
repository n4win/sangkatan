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

    const where = search
      ? {
          OR: [
            { title: { contains: search } },
            { content: { contains: search } },
          ],
        }
      : {};

    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        include: {
          images: { orderBy: { sortOrder: "asc" } },
          _count: { select: { images: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.activity.count({ where }),
    ]);

    return NextResponse.json({
      data: activities,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Activities GET Error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูลกิจกรรม" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();
    const { title, content, coverImage, isPublished, images } = body;

    const slug = title
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w\-ก-๙]+/g, "")
      .concat("-", Date.now().toString(36));

    const activity = await prisma.activity.create({
      data: {
        title,
        content,
        coverImage: coverImage || null,
        slug,
        isPublished: isPublished ?? false,
        publishedAt: isPublished ? new Date() : null,
        images: images?.length
          ? {
              create: images.map(
                (img: { url: string; caption?: string }, i: number) => ({
                  url: img.url,
                  caption: img.caption ?? null,
                  sortOrder: i,
                }),
              ),
            }
          : undefined,
      },
      include: { images: true },
    });

    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    console.error("Activities POST Error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการสร้างกิจกรรม" },
      { status: 500 },
    );
  }
}
