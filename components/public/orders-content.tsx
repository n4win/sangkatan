"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Container,
  Title,
  Text,
  Stack,
  Group,
  Paper,
  Badge,
  Loader,
  Accordion,
  Box,
  Divider,
  Button,
  Modal,
  SimpleGrid,
  Image as MantineImage,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconShoppingBag,
  IconPackage,
  IconTruck,
  IconCheck,
  IconX,
  IconClock,
  IconCreditCard,
  IconCamera,
} from "@tabler/icons-react";

interface OrderItem {
  id: string;
  quantity: number;
  price: string;
  subtotal: string;
  product: {
    id: string;
    name: string;
    slug: string;
    images: { url: string; alt: string | null }[];
  };
}

interface Payment {
  id: string;
  method: string;
  status: string;
  amount: string;
  paidAt: string | null;
}

interface ProofImage {
  id: string;
  url: string;
  caption: string | null;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: string;
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  note: string | null;
  shippingCarrier: string | null;
  trackingNumber: string | null;
  items: OrderItem[];
  payment: Payment | null;
  proofImages: ProofImage[];
  createdAt: string;
}

const statusConfig: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  PENDING: {
    label: "รอดำเนินการ",
    color: "yellow",
    icon: <IconClock size={14} />,
  },
  PAID: {
    label: "ชำระแล้ว",
    color: "blue",
    icon: <IconCreditCard size={14} />,
  },
  PROCESSING: {
    label: "กำลังจัดเตรียม",
    color: "orange",
    icon: <IconPackage size={14} />,
  },
  SHIPPED: {
    label: "จัดส่งแล้ว",
    color: "indigo",
    icon: <IconTruck size={14} />,
  },
  DELIVERED: {
    label: "ได้รับสินค้าแล้ว",
    color: "green",
    icon: <IconCheck size={14} />,
  },
  CANCELLED: {
    label: "ยกเลิก",
    color: "red",
    icon: <IconX size={14} />,
  },
};

const CARRIER_LABEL: Record<string, string> = {
  THAILAND_POST: "ไปรษณีย์ไทย",
  KERRY: "Kerry Express",
  FLASH: "Flash Express",
  "J&T": "J&T Express",
  SHOPEE: "Shopee Express",
  NINJA: "Ninja Van",
  BEST: "Best Express",
  DHL: "DHL",
  SELF: "จัดส่งเอง",
};

export function OrdersContent() {
  const { status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<{
    opened: boolean;
    orderId: string;
    orderNumber: string;
  }>({ opened: false, orderId: "", orderNumber: "" });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin?callbackUrl=/orders");
      return;
    }
    if (status === "authenticated") {
      fetchOrders();
    }
  }, [status, router]);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/user/orders");
      const data = await res.json();
      setOrders(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = useCallback(async (orderId: string) => {
    setCancellingId(orderId);
    try {
      const res = await fetch(`/api/user/orders/${orderId}/cancel`, {
        method: "PATCH",
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId ? { ...o, status: "CANCELLED" } : o,
          ),
        );
        notifications.show({
          title: "ยกเลิกแล้ว",
          message: "คำสั่งซื้อถูกยกเลิกเรียบร้อยแล้ว",
          color: "green",
        });
      } else {
        const data = await res.json();
        notifications.show({
          title: "ไม่สามารถยกเลิกได้",
          message: data.error || "เกิดข้อผิดพลาด",
          color: "red",
        });
      }
    } catch {
      notifications.show({
        title: "เกิดข้อผิดพลาด",
        message: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้",
        color: "red",
      });
    } finally {
      setCancellingId(null);
      setConfirmCancel((prev) => ({ ...prev, opened: false }));
    }
  }, []);

  if (status === "loading" || loading) {
    return (
      <Container size="md" py={80}>
        <Stack align="center" gap="md">
          <Loader color="green" />
          <Text c="dimmed">กำลังโหลด...</Text>
        </Stack>
      </Container>
    );
  }

  return (
    <Container size="md" py="xl">
      <Title order={2} mb="xl">
        การซื้อของฉัน
      </Title>

      {orders.length === 0 ? (
        <Paper withBorder radius="md" p={60}>
          <Stack align="center" gap="md">
            <IconShoppingBag size={48} color="var(--mantine-color-gray-4)" />
            <Text c="dimmed" size="lg">
              ยังไม่มีคำสั่งซื้อ
            </Text>
            <Text c="dimmed" size="sm">
              เริ่มช้อปปิ้งสินค้าสังฆทานกันเลย
            </Text>
          </Stack>
        </Paper>
      ) : (
        <Accordion variant="separated" radius="md">
          {orders.map((order) => {
            const cfg = statusConfig[order.status] ?? statusConfig.PENDING;

            return (
              <Accordion.Item key={order.id} value={order.id}>
                <Accordion.Control>
                  <Group justify="space-between" wrap="wrap" gap="xs">
                    <div>
                      <Text size="sm" fw={600}>
                        คำสั่งซื้อ #{order.orderNumber}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {new Date(order.createdAt).toLocaleDateString("th-TH", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                    </div>
                    <Group gap="xs">
                      <Badge
                        variant="light"
                        color={cfg.color}
                        leftSection={cfg.icon}
                        size="md"
                      >
                        {cfg.label}
                      </Badge>
                      <Text size="sm" fw={700} c="green.7">
                        ฿{Number(order.totalAmount).toLocaleString()}
                      </Text>
                    </Group>
                  </Group>
                </Accordion.Control>
                <Accordion.Panel>
                  <Stack gap="sm">
                    {order.items.map((item) => {
                      const imgUrl = item.product.images?.[0]?.url;
                      return (
                        <Group
                          key={item.id}
                          gap="sm"
                          wrap="nowrap"
                          align="center"
                        >
                          <Box
                            pos="relative"
                            w={56}
                            h={56}
                            bg="gray.0"
                            style={{
                              borderRadius: "var(--mantine-radius-md)",
                              overflow: "hidden",
                              flexShrink: 0,
                            }}
                          >
                            {imgUrl ? (
                              <Image
                                src={imgUrl}
                                alt={item.product.name}
                                fill
                                style={{ objectFit: "cover" }}
                              />
                            ) : (
                              <Box
                                h="100%"
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <IconShoppingBag
                                  size={20}
                                  color="var(--mantine-color-gray-4)"
                                />
                              </Box>
                            )}
                          </Box>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <Text
                              size="sm"
                              fw={500}
                              lineClamp={1}
                              component={Link}
                              href={`/products/${item.product.slug}`}
                              style={{
                                textDecoration: "none",
                                color: "inherit",
                              }}
                            >
                              {item.product.name}
                            </Text>
                            <Text size="xs" c="dimmed">
                              ฿{Number(item.price).toLocaleString()} ×{" "}
                              {item.quantity}
                            </Text>
                          </div>
                          <Text size="sm" fw={600} style={{ flexShrink: 0 }}>
                            ฿{Number(item.subtotal).toLocaleString()}
                          </Text>
                        </Group>
                      );
                    })}

                    <Divider />

                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">
                        จัดส่งถึง
                      </Text>
                      <div style={{ textAlign: "right" }}>
                        <Text size="sm" fw={500}>
                          {order.shippingName}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {order.shippingPhone}
                        </Text>
                        <Text size="xs" c="dimmed" maw={250} lineClamp={2}>
                          {order.shippingAddress}
                        </Text>
                      </div>
                    </Group>

                    {order.note && (
                      <Group justify="space-between">
                        <Text size="sm" c="dimmed">
                          หมายเหตุ
                        </Text>
                        <Text size="sm" maw={250} ta="right">
                          {order.note}
                        </Text>
                      </Group>
                    )}

                    {(order.shippingCarrier || order.trackingNumber) && (
                      <>
                        <Divider />
                        <Group justify="space-between" align="flex-start">
                          <Group gap={6}>
                            <IconTruck
                              size={16}
                              color="var(--mantine-color-cyan-6)"
                            />
                            <Text size="sm" fw={500}>
                              ข้อมูลจัดส่งพัสดุ
                            </Text>
                          </Group>
                          <div style={{ textAlign: "right" }}>
                            {order.shippingCarrier && (
                              <Badge
                                variant="light"
                                color="cyan"
                                size="sm"
                                mb={4}
                              >
                                {CARRIER_LABEL[order.shippingCarrier] ??
                                  order.shippingCarrier}
                              </Badge>
                            )}
                            {order.trackingNumber && (
                              <Text size="sm" fw={600} ff="monospace">
                                {order.trackingNumber}
                              </Text>
                            )}
                          </div>
                        </Group>
                      </>
                    )}

                    {order.proofImages && order.proofImages.length > 0 && (
                      <>
                        <Divider />
                        <Stack gap="xs">
                          <Group gap={6}>
                            <IconCamera
                              size={16}
                              color="var(--mantine-color-pink-6)"
                            />
                            <Text size="sm" fw={500}>
                              หลักฐานการถวายสังฆทาน
                            </Text>
                          </Group>
                          <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="xs">
                            {order.proofImages.map((img) => (
                              <MantineImage
                                key={img.id}
                                src={img.url}
                                alt={img.caption ?? "หลักฐาน"}
                                radius="md"
                                h={120}
                                fit="cover"
                                style={{
                                  border:
                                    "1px solid var(--mantine-color-gray-3)",
                                  cursor: "pointer",
                                }}
                              />
                            ))}
                          </SimpleGrid>
                        </Stack>
                      </>
                    )}

                    {order.status === "PENDING" && (
                      <Group grow>
                        <Button
                          component={Link}
                          href={`/orders/${order.id}/payment`}
                          color="green"
                          radius="md"
                          leftSection={<IconCreditCard size={16} />}
                        >
                          ชำระเงิน
                        </Button>
                        <Button
                          variant="light"
                          color="red"
                          radius="md"
                          leftSection={<IconX size={16} />}
                          loading={cancellingId === order.id}
                          onClick={() =>
                            setConfirmCancel({
                              opened: true,
                              orderId: order.id,
                              orderNumber: order.orderNumber,
                            })
                          }
                        >
                          ยกเลิก
                        </Button>
                      </Group>
                    )}
                  </Stack>
                </Accordion.Panel>
              </Accordion.Item>
            );
          })}
        </Accordion>
      )}
      {/* Confirm cancel modal */}
      <Modal
        opened={confirmCancel.opened}
        onClose={() => setConfirmCancel((prev) => ({ ...prev, opened: false }))}
        centered
        radius="md"
        title="ยืนยันการยกเลิก"
        size="sm"
        overlayProps={{ backgroundOpacity: 0.4, blur: 2 }}
      >
        <Stack gap="md">
          <Text size="sm">
            คุณต้องการยกเลิกคำสั่งซื้อ #{confirmCancel.orderNumber} ใช่หรือไม่?
          </Text>

          <Group justify="flex-end">
            <Button
              variant="default"
              radius="md"
              onClick={() =>
                setConfirmCancel((prev) => ({ ...prev, opened: false }))
              }
            >
              ย้อนกลับ
            </Button>
            <Button
              color="red"
              radius="md"
              loading={cancellingId === confirmCancel.orderId}
              onClick={() => cancelOrder(confirmCancel.orderId)}
            >
              ยกเลิกคำสั่งซื้อ
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
