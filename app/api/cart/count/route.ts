import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - ดึงจำนวนสินค้าในตะกร้า
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ count: 0 });
  }

  const count = await prisma.cartItem.count({
    where: { cart: { userId: session.user.id } },
  });

  return NextResponse.json({ count });
}
