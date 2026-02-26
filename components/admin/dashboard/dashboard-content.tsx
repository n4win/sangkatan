"use client";

import { useEffect, useState } from "react";
import {
  SimpleGrid,
  Paper,
  Text,
  Group,
  Title,
  Stack,
  Table,
  Badge,
  Skeleton,
  ThemeIcon,
  rem,
  Avatar,
  Progress,
  Divider,
  Box,
  Center,
} from "@mantine/core";
import {
  IconPackage,
  IconUsers,
  IconShoppingCart,
  IconCash,
  IconTrendingUp,
  IconReceipt,
  IconAlertTriangle,
  IconClock,
  IconArrowUpRight,
  IconCreditCard,
  IconBuildingBank,
  IconQrcode,
} from "@tabler/icons-react";
import { AreaChart, BarChart, DonutChart, LineChart } from "@mantine/charts";

interface DashboardData {
  stats: {
    totalProducts: number;
    activeProducts: number;
    totalUsers: number;
    totalOrders: number;
    totalBanners: number;
    totalRevenue: number;
    todayRevenue: number;
    todayOrders: number;
    newUsersToday: number;
    pendingPayments: number;
  };
  recentOrders: {
    id: string;
    orderNumber: string;
    status: string;
    totalAmount: number;
    createdAt: string;
    user: { name: string | null; email: string | null; image: string | null };
    items: { product: { name: string } }[];
    payment: { method: string; status: string } | null;
  }[];
  ordersByStatus: { status: string; count: number }[];
  monthlySales: { month: string; revenue: number; orders: number }[];
  dailySales: { date: string; revenue: number; orders: number }[];
  topProducts: { name: string; totalSold: number; totalRevenue: number }[];
  paymentByMethod: { method: string; count: number; total: number }[];
  monthlyNewUsers: { month: string; count: number }[];
  lowStockProducts: {
    id: string;
    name: string;
    stock: number;
    price: number;
  }[];
}

const ORDER_STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: "รอดำเนินการ", color: "yellow" },
  PAID: { label: "ชำระแล้ว", color: "blue" },
  PROCESSING: { label: "กำลังจัดเตรียม", color: "indigo" },
  SHIPPED: { label: "จัดส่งแล้ว", color: "cyan" },
  DELIVERED: { label: "สำเร็จ", color: "green" },
  CANCELLED: { label: "ยกเลิก", color: "red" },
};

const PAYMENT_METHOD_MAP: Record<
  string,
  { label: string; color: string; icon: typeof IconCash }
> = {
  BANK_TRANSFER: {
    label: "โอนเงิน",
    color: "blue",
    icon: IconBuildingBank,
  },
  PROMPTPAY: { label: "พร้อมเพย์", color: "indigo", icon: IconQrcode },
  CREDIT_CARD: {
    label: "บัตรเครดิต",
    color: "orange",
    icon: IconCreditCard,
  },
};

const THAI_MONTHS: Record<string, string> = {
  "01": "ม.ค.",
  "02": "ก.พ.",
  "03": "มี.ค.",
  "04": "เม.ย.",
  "05": "พ.ค.",
  "06": "มิ.ย.",
  "07": "ก.ค.",
  "08": "ส.ค.",
  "09": "ก.ย.",
  "10": "ต.ค.",
  "11": "พ.ย.",
  "12": "ธ.ค.",
};

function formatThaiMonth(ym: string) {
  const m = ym.split("-")[1];
  return THAI_MONTHS[m] ?? m;
}

function formatCurrency(n: number) {
  return `฿${n.toLocaleString("th-TH", { minimumFractionDigits: 0 })}`;
}

export function DashboardContent() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Stack gap="lg">
        <Group justify="space-between" align="flex-end">
          <div>
            <Skeleton h={14} w={100} mb={6} />
            <Skeleton h={28} w={200} />
          </div>
        </Group>
        <SimpleGrid cols={{ base: 1, xs: 2, lg: 4 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} h={140} radius="md" />
          ))}
        </SimpleGrid>
        <SimpleGrid cols={{ base: 1, md: 2 }}>
          <Skeleton h={350} radius="md" />
          <Skeleton h={350} radius="md" />
        </SimpleGrid>
        <SimpleGrid cols={{ base: 1, md: 3 }}>
          <Skeleton h={300} radius="md" />
          <Skeleton h={300} radius="md" />
          <Skeleton h={300} radius="md" />
        </SimpleGrid>
      </Stack>
    );
  }

  if (!data) return <Text c="red">ไม่สามารถโหลดข้อมูลได้</Text>;

  const { stats } = data;

  const statCards = [
    {
      title: "รายได้รวม",
      value: formatCurrency(Number(stats.totalRevenue)),
      subtitle: `วันนี้ ${formatCurrency(Number(stats.todayRevenue))}`,
      icon: IconCash,
      color: "green",
    },
    {
      title: "ออเดอร์ทั้งหมด",
      value: stats.totalOrders.toLocaleString(),
      subtitle: `วันนี้ ${stats.todayOrders} รายการ`,
      icon: IconShoppingCart,
      color: "blue",
    },
    {
      title: "ผู้ใช้งาน",
      value: stats.totalUsers.toLocaleString(),
      subtitle: `ใหม่วันนี้ +${stats.newUsersToday}`,
      icon: IconUsers,
      color: "violet",
    },
    {
      title: "รอดำเนินการ",
      value: stats.pendingPayments.toLocaleString(),
      subtitle: `สินค้า ${stats.activeProducts}/${stats.totalProducts}`,
      icon: IconClock,
      color: "orange",
    },
  ];

  const revenueChartData = data.monthlySales.map((s) => ({
    month: formatThaiMonth(s.month),
    รายได้: Number(s.revenue),
    ออเดอร์: Number(s.orders),
  }));

  const dailyChartData = data.dailySales.map((s) => ({
    date: s.date.slice(5),
    รายได้: Number(s.revenue),
    ออเดอร์: Number(s.orders),
  }));

  const orderStatusDonut = data.ordersByStatus.map((os) => {
    const info = ORDER_STATUS_MAP[os.status] ?? {
      label: os.status,
      color: "gray",
    };
    return { name: info.label, value: os.count, color: `${info.color}.6` };
  });

  const topProductsChart = data.topProducts.map((p) => ({
    product: p.name.length > 18 ? p.name.slice(0, 18) + "…" : p.name,
    จำนวนขาย: Number(p.totalSold),
    รายได้: Number(p.totalRevenue),
  }));

  const paymentDonut = data.paymentByMethod.map((p) => {
    const info = PAYMENT_METHOD_MAP[p.method] ?? {
      label: p.method,
      color: "gray",
    };
    return {
      name: info.label,
      value: Number(p.count),
      color: `${info.color}.6`,
    };
  });

  const usersChartData = data.monthlyNewUsers.map((u) => ({
    month: formatThaiMonth(u.month),
    สมาชิกใหม่: Number(u.count),
  }));

  const totalStatusOrders = data.ordersByStatus.reduce(
    (sum, o) => sum + o.count,
    0,
  );

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-end">
        <div>
          <Text size="sm" c="dimmed">
            ภาพรวมระบบ
          </Text>
          <Title order={2}>แดชบอร์ด</Title>
        </div>
        <Badge
          variant="light"
          color="green"
          size="lg"
          leftSection={<IconTrendingUp size={14} />}
        >
          อัปเดตล่าสุด:{" "}
          {new Date().toLocaleTimeString("th-TH", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Badge>
      </Group>

      {/* ── Stat Cards ── */}
      <SimpleGrid cols={{ base: 1, xs: 2, lg: 4 }}>
        {statCards.map((card) => (
          <Paper key={card.title} withBorder p="lg" radius="md" shadow="sm">
            <Group justify="space-between" align="flex-start">
              <div style={{ flex: 1 }}>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                  {card.title}
                </Text>
                <Text fw={700} size="1.5rem" mt={8} lh={1}>
                  {card.value}
                </Text>
                <Group gap={4} mt={8}>
                  <IconArrowUpRight
                    size={14}
                    color="var(--mantine-color-teal-6)"
                  />
                  <Text size="xs" c="teal">
                    {card.subtitle}
                  </Text>
                </Group>
              </div>
              <ThemeIcon
                color={card.color}
                variant="light"
                size={52}
                radius="xl"
              >
                <card.icon style={{ width: rem(26), height: rem(26) }} />
              </ThemeIcon>
            </Group>
          </Paper>
        ))}
      </SimpleGrid>

      {/* ── Revenue & Daily Trend ── */}
      <SimpleGrid cols={{ base: 1, lg: 2 }}>
        <Paper withBorder p="lg" radius="md" shadow="sm">
          <Group justify="space-between" mb="md">
            <div>
              <Text fw={600} size="lg">
                รายได้รายเดือน
              </Text>
              <Text size="xs" c="dimmed">
                ย้อนหลัง 12 เดือน
              </Text>
            </div>
            <Badge variant="light" color="green" size="sm">
              {formatCurrency(Number(stats.totalRevenue))}
            </Badge>
          </Group>
          <AreaChart
            h={280}
            data={revenueChartData}
            dataKey="month"
            series={[{ name: "รายได้", color: "green.6" }]}
            curveType="natural"
            withGradient
            gridAxis="xy"
            withDots={false}
            valueFormatter={(v) => formatCurrency(v)}
          />
        </Paper>

        <Paper withBorder p="lg" radius="md" shadow="sm">
          <Group justify="space-between" mb="md">
            <div>
              <Text fw={600} size="lg">
                ออเดอร์รายวัน
              </Text>
              <Text size="xs" c="dimmed">
                30 วันล่าสุด
              </Text>
            </div>
            <Badge variant="light" color="blue" size="sm">
              วันนี้ {stats.todayOrders} รายการ
            </Badge>
          </Group>
          <AreaChart
            h={280}
            data={dailyChartData}
            dataKey="date"
            series={[
              { name: "ออเดอร์", color: "blue.6" },
              { name: "รายได้", color: "cyan.4" },
            ]}
            curveType="natural"
            withGradient
            gridAxis="xy"
            withDots={false}
            valueFormatter={(v) =>
              v >= 1000 ? formatCurrency(v) : v.toString()
            }
          />
        </Paper>
      </SimpleGrid>

      {/* ── Order Status, Top Products, Payment Methods ── */}
      <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }}>
        <Paper withBorder p="lg" radius="md" shadow="sm">
          <Text fw={600} size="lg" mb={4}>
            สถานะออเดอร์
          </Text>
          <Text size="xs" c="dimmed" mb="md">
            ทั้งหมด {totalStatusOrders} รายการ
          </Text>
          <Center>
            <DonutChart
              data={orderStatusDonut}
              size={180}
              thickness={28}
              tooltipDataSource="segment"
              chartLabel={`${totalStatusOrders}`}
              withLabelsLine={false}
            />
          </Center>
          <Divider my="md" />
          <Stack gap={8}>
            {data.ordersByStatus.map((os) => {
              const info = ORDER_STATUS_MAP[os.status] ?? {
                label: os.status,
                color: "gray",
              };
              const pct =
                totalStatusOrders > 0
                  ? Math.round((os.count / totalStatusOrders) * 100)
                  : 0;
              return (
                <div key={os.status}>
                  <Group justify="space-between" mb={4}>
                    <Group gap="xs">
                      <Box
                        w={10}
                        h={10}
                        style={{
                          borderRadius: "50%",
                          backgroundColor: `var(--mantine-color-${info.color}-6)`,
                        }}
                      />
                      <Text size="sm">{info.label}</Text>
                    </Group>
                    <Text size="sm" fw={500}>
                      {os.count} ({pct}%)
                    </Text>
                  </Group>
                  <Progress
                    value={pct}
                    color={info.color}
                    size="xs"
                    radius="xl"
                  />
                </div>
              );
            })}
          </Stack>
        </Paper>

        <Paper withBorder p="lg" radius="md" shadow="sm">
          <Text fw={600} size="lg" mb={4}>
            สินค้าขายดี
          </Text>
          <Text size="xs" c="dimmed" mb="md">
            Top 8 จำนวนการขาย
          </Text>
          {topProductsChart.length > 0 ? (
            <BarChart
              h={340}
              data={topProductsChart}
              dataKey="product"
              series={[{ name: "จำนวนขาย", color: "teal.6" }]}
              orientation="vertical"
              gridAxis="none"
              barProps={{ radius: [0, 4, 4, 0] }}
              withTooltip
            />
          ) : (
            <Center h={300}>
              <Text c="dimmed" size="sm">
                ยังไม่มีข้อมูลการขาย
              </Text>
            </Center>
          )}
        </Paper>

        <Paper withBorder p="lg" radius="md" shadow="sm">
          <Text fw={600} size="lg" mb={4}>
            ช่องทางชำระเงิน
          </Text>
          <Text size="xs" c="dimmed" mb="md">
            สัดส่วนจำนวนรายการ
          </Text>
          {paymentDonut.length > 0 ? (
            <>
              <Center>
                <DonutChart
                  data={paymentDonut}
                  size={180}
                  thickness={28}
                  tooltipDataSource="segment"
                  paddingAngle={4}
                />
              </Center>
              <Divider my="md" />
              <Stack gap="sm">
                {data.paymentByMethod.map((p) => {
                  const info = PAYMENT_METHOD_MAP[p.method] ?? {
                    label: p.method,
                    color: "gray",
                    icon: IconReceipt,
                  };
                  return (
                    <Group key={p.method} justify="space-between">
                      <Group gap="xs">
                        <ThemeIcon
                          color={info.color}
                          variant="light"
                          size="sm"
                          radius="xl"
                        >
                          <info.icon size={14} />
                        </ThemeIcon>
                        <Text size="sm">{info.label}</Text>
                      </Group>
                      <div style={{ textAlign: "right" }}>
                        <Text size="sm" fw={600}>
                          {Number(p.count)} รายการ
                        </Text>
                        <Text size="xs" c="dimmed">
                          {formatCurrency(Number(p.total))}
                        </Text>
                      </div>
                    </Group>
                  );
                })}
              </Stack>
            </>
          ) : (
            <Center h={300}>
              <Text c="dimmed" size="sm">
                ยังไม่มีข้อมูลการชำระเงิน
              </Text>
            </Center>
          )}
        </Paper>
      </SimpleGrid>

      {/* ── New Users Trend & Low Stock ── */}
      <SimpleGrid cols={{ base: 1, lg: 2 }}>
        <Paper withBorder p="lg" radius="md" shadow="sm">
          <Group justify="space-between" mb="md">
            <div>
              <Text fw={600} size="lg">
                สมาชิกใหม่
              </Text>
              <Text size="xs" c="dimmed">
                6 เดือนล่าสุด
              </Text>
            </div>
            <Badge variant="light" color="violet" size="sm">
              {stats.totalUsers} คน
            </Badge>
          </Group>
          <LineChart
            h={240}
            data={usersChartData}
            dataKey="month"
            series={[{ name: "สมาชิกใหม่", color: "violet.6" }]}
            curveType="natural"
            connectNulls
            gridAxis="xy"
            withDots
            dotProps={{ r: 4 }}
          />
        </Paper>

        <Paper withBorder p="lg" radius="md" shadow="sm">
          <Group justify="space-between" mb="md">
            <div>
              <Text fw={600} size="lg">
                สินค้าใกล้หมด
              </Text>
              <Text size="xs" c="dimmed">
                สต็อก ≤ 5 ชิ้น
              </Text>
            </div>
            {data.lowStockProducts.length > 0 && (
              <Badge
                variant="light"
                color="red"
                size="sm"
                leftSection={<IconAlertTriangle size={12} />}
              >
                {data.lowStockProducts.length} รายการ
              </Badge>
            )}
          </Group>
          {data.lowStockProducts.length > 0 ? (
            <Stack gap="sm">
              {data.lowStockProducts.map((p) => {
                const pct = Math.round((p.stock / 5) * 100);
                return (
                  <div key={p.id}>
                    <Group justify="space-between" mb={4}>
                      <Text
                        size="sm"
                        fw={500}
                        lineClamp={1}
                        style={{ flex: 1 }}
                      >
                        {p.name}
                      </Text>
                      <Group gap="xs">
                        <Text
                          size="sm"
                          fw={700}
                          c={p.stock === 0 ? "red" : "orange"}
                        >
                          {p.stock === 0 ? "หมด" : `${p.stock} ชิ้น`}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {formatCurrency(Number(p.price))}
                        </Text>
                      </Group>
                    </Group>
                    <Progress
                      value={pct}
                      color={
                        p.stock === 0
                          ? "red"
                          : p.stock <= 2
                            ? "orange"
                            : "yellow"
                      }
                      size="sm"
                      radius="xl"
                      animated={p.stock > 0 && p.stock <= 2}
                    />
                  </div>
                );
              })}
            </Stack>
          ) : (
            <Center h={200}>
              <Stack align="center" gap="xs">
                <ThemeIcon color="green" variant="light" size="xl" radius="xl">
                  <IconPackage size={24} />
                </ThemeIcon>
                <Text c="dimmed" size="sm">
                  ไม่มีสินค้าใกล้หมด
                </Text>
              </Stack>
            </Center>
          )}
        </Paper>
      </SimpleGrid>

      {/* ── Recent Orders Table ── */}
      <Paper withBorder p="lg" radius="md" shadow="sm">
        <Group justify="space-between" mb="md">
          <div>
            <Text fw={600} size="lg">
              ออเดอร์ล่าสุด
            </Text>
            <Text size="xs" c="dimmed">
              8 รายการล่าสุด
            </Text>
          </div>
          <Badge variant="light" size="sm">
            {stats.totalOrders} รายการทั้งหมด
          </Badge>
        </Group>
        <Table striped highlightOnHover verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>หมายเลข</Table.Th>
              <Table.Th>ลูกค้า</Table.Th>
              <Table.Th>สินค้า</Table.Th>
              <Table.Th ta="center">สถานะ</Table.Th>
              <Table.Th ta="center">ชำระเงิน</Table.Th>
              <Table.Th ta="right">ยอดรวม</Table.Th>
              <Table.Th>วันที่</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data.recentOrders.map((order) => {
              const info = ORDER_STATUS_MAP[order.status] ?? {
                label: order.status,
                color: "gray",
              };
              const paymentInfo = order.payment
                ? PAYMENT_METHOD_MAP[order.payment.method]
                : null;
              const itemNames = order.items
                .map((i) => i.product.name)
                .join(", ");

              return (
                <Table.Tr key={order.id}>
                  <Table.Td>
                    <Text size="sm" fw={600} c="blue">
                      {order.orderNumber}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Avatar
                        src={order.user.image}
                        size="sm"
                        radius="xl"
                        color="green"
                      >
                        {(order.user.name ??
                          order.user.email ??
                          "?")[0]?.toUpperCase()}
                      </Avatar>
                      <div>
                        <Text size="sm" fw={500} lineClamp={1}>
                          {order.user.name ?? "-"}
                        </Text>
                        <Text size="xs" c="dimmed" lineClamp={1}>
                          {order.user.email}
                        </Text>
                      </div>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Text size="xs" c="dimmed" lineClamp={1} maw={180}>
                      {itemNames || "-"}
                    </Text>
                  </Table.Td>
                  <Table.Td ta="center">
                    <Badge color={info.color} variant="light" size="sm">
                      {info.label}
                    </Badge>
                  </Table.Td>
                  <Table.Td ta="center">
                    {paymentInfo ? (
                      <Badge
                        variant="dot"
                        color={
                          order.payment?.status === "COMPLETED"
                            ? "green"
                            : "yellow"
                        }
                        size="sm"
                      >
                        {paymentInfo.label}
                      </Badge>
                    ) : (
                      <Text size="xs" c="dimmed">
                        -
                      </Text>
                    )}
                  </Table.Td>
                  <Table.Td ta="right">
                    <Text size="sm" fw={600}>
                      {formatCurrency(Number(order.totalAmount))}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="xs" c="dimmed">
                      {new Date(order.createdAt).toLocaleDateString("th-TH", {
                        day: "numeric",
                        month: "short",
                        year: "2-digit",
                      })}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              );
            })}
            {data.recentOrders.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={7} ta="center" py="xl">
                  <Stack align="center" gap="xs">
                    <ThemeIcon
                      color="gray"
                      variant="light"
                      size="xl"
                      radius="xl"
                    >
                      <IconReceipt size={24} />
                    </ThemeIcon>
                    <Text c="dimmed">ยังไม่มีออเดอร์</Text>
                  </Stack>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Paper>
    </Stack>
  );
}
