import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

function serialize(obj: unknown): unknown {
  if (typeof obj === "bigint") return Number(obj);
  if (obj !== null && typeof obj === "object") {
    if (
      "toNumber" in obj &&
      typeof (obj as { toNumber: unknown }).toNumber === "function"
    )
      return (obj as { toNumber: () => number }).toNumber();
    if (Array.isArray(obj)) return obj.map(serialize);
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, serialize(v)]),
    );
  }
  return obj;
}

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const [
      totalProducts,
      activeProducts,
      totalUsers,
      totalOrders,
      totalBanners,
      recentOrders,
      ordersByStatus,
      monthlySales,
      dailySales,
      topProducts,
      paymentByMethod,
      monthlyNewUsers,
      lowStockProducts,
      pendingPayments,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { isActive: true } }),
      prisma.user.count(),
      prisma.order.count({ where: { status: { not: "CANCELLED" } } }),
      prisma.banner.count(),

      prisma.order.findMany({
        take: 8,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true, email: true, image: true } },
          items: {
            include: { product: { select: { name: true } } },
          },
          payment: { select: { method: true, status: true } },
        },
      }),

      prisma.order.groupBy({
        by: ["status"],
        _count: { id: true },
      }),

      prisma.$queryRawUnsafe<
        { month: string; revenue: number; orders: number }[]
      >(
        `SELECT DATE_FORMAT(createdAt, '%Y-%m') as month, CAST(SUM(totalAmount) AS DECIMAL(12,2)) as revenue, COUNT(*) as orders FROM orders WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 12 MONTH) AND status != 'CANCELLED' GROUP BY month ORDER BY month ASC`,
      ),

      prisma.$queryRawUnsafe<
        { date: string; revenue: number; orders: number }[]
      >(
        `SELECT DATE_FORMAT(createdAt, '%Y-%m-%d') as date, CAST(SUM(totalAmount) AS DECIMAL(12,2)) as revenue, COUNT(*) as orders FROM orders WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY) AND status != 'CANCELLED' GROUP BY date ORDER BY date ASC`,
      ),

      prisma.$queryRawUnsafe<
        { name: string; totalSold: number; totalRevenue: number }[]
      >(
        `SELECT p.name, CAST(SUM(oi.quantity) AS UNSIGNED) as totalSold, CAST(SUM(oi.subtotal) AS DECIMAL(12,2)) as totalRevenue FROM order_items oi JOIN products p ON oi.productId = p.id JOIN orders o ON oi.orderId = o.id WHERE o.status != 'CANCELLED' GROUP BY oi.productId, p.name ORDER BY totalSold DESC LIMIT 8`,
      ),

      prisma.$queryRawUnsafe<
        { method: string; count: number; total: number }[]
      >(
        `SELECT p.method, COUNT(*) as count, CAST(SUM(p.amount) AS DECIMAL(12,2)) as total FROM payments p JOIN orders o ON p.orderId = o.id WHERE o.status != 'CANCELLED' GROUP BY p.method`,
      ),

      prisma.$queryRawUnsafe<{ month: string; count: number }[]>(
        `SELECT DATE_FORMAT(createdAt, '%Y-%m') as month, COUNT(*) as count FROM users WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 6 MONTH) GROUP BY month ORDER BY month ASC`,
      ),

      prisma.product.findMany({
        where: { stock: { lte: 5 }, isActive: true },
        select: { id: true, name: true, stock: true, price: true },
        orderBy: { stock: "asc" },
        take: 5,
      }),

      prisma.order.count({
        where: { status: "PENDING" },
      }),
    ]);

    const revenue = await prisma.order.aggregate({
      where: { status: { in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] } },
      _sum: { totalAmount: true },
    });

    const todayRevenue = await prisma.$queryRawUnsafe<{ total: number }[]>(
      `SELECT CAST(COALESCE(SUM(totalAmount), 0) AS DECIMAL(12,2)) as total FROM orders WHERE DATE(createdAt) = CURDATE() AND status IN ('PAID','PROCESSING','SHIPPED','DELIVERED')`,
    );

    const todayOrders = await prisma.order.count({
      where: {
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        status: { not: "CANCELLED" },
      },
    });

    const newUsersToday = await prisma.user.count({
      where: {
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    });

    const data = {
      stats: {
        totalProducts,
        activeProducts,
        totalUsers,
        totalOrders,
        totalBanners,
        totalRevenue: revenue._sum.totalAmount ?? 0,
        todayRevenue: todayRevenue[0]?.total ?? 0,
        todayOrders,
        newUsersToday,
        pendingPayments,
      },
      recentOrders,
      ordersByStatus: ordersByStatus.map(
        (o: { status: string; _count: { id: number } }) => ({
          status: o.status,
          count: o._count.id,
        }),
      ),
      monthlySales,
      dailySales,
      topProducts,
      paymentByMethod,
      monthlyNewUsers,
      lowStockProducts,
    };

    return NextResponse.json(serialize(data));
  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูล" },
      { status: 500 },
    );
  }
}
