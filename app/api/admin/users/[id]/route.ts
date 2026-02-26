import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { requireAdmin } from "@/lib/admin-auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        phone: true,
        address: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        orders: {
          take: 10,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            orderNumber: true,
            status: true,
            totalAmount: true,
            createdAt: true,
          },
        },
        _count: { select: { orders: true, reviews: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("User GET Error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { id } = await params;
    const body = await request.json();
    const { name, email, phone, address, role } = body;

    const user = await prisma.user.update({
      where: { id },
      data: { name, email, phone, address, role },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("User PUT Error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการแก้ไขข้อมูลผู้ใช้" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  try {
    const { id } = await params;
    if (session?.user?.id === id) {
      return NextResponse.json(
        { error: "ไม่สามารถลบบัญชีตัวเองได้" },
        { status: 403 },
      );
    }
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ message: "ลบผู้ใช้สำเร็จ" });
  } catch (error) {
    console.error("User DELETE Error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการลบผู้ใช้" },
      { status: 500 },
    );
  }
}
