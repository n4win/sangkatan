"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Container,
  Text,
  Stack,
  Group,
  Paper,
  Button,
  Loader,
  Box,
  Divider,
  Badge,
  Alert,
  FileButton,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconCheck,
  IconUpload,
  IconPhoto,
  IconAlertTriangle,
  IconCopy,
  IconShoppingBag,
  IconReceipt,
} from "@tabler/icons-react";

interface OrderItem {
  id: string;
  quantity: number;
  price: string;
  subtotal: string;
  product: {
    id: string;
    name: string;
    images: { url: string; alt: string | null }[];
  };
}

interface Payment {
  id: string;
  method: string;
  status: string;
  amount: string;
  slipImage: string | null;
  paidAt: string | null;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: string;
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  items: OrderItem[];
  payment: Payment | null;
  createdAt: string;
}

export function PaymentContent({ orderId }: { orderId: string }) {
  const { status } = useSession();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const resetRef = useRef<() => void>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
      return;
    }
    if (status === "authenticated") {
      fetchOrder();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/user/orders`);
      const orders: Order[] = await res.json();
      const found = orders.find((o) => o.id === orderId);
      if (!found) {
        router.push("/orders");
        return;
      }
      setOrder(found);
      if (found.payment?.slipImage) {
        setSlipPreview(found.payment.slipImage);
      }
    } catch {
      router.push("/orders");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (file: File | null) => {
    if (!file) return;

    // Validate
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      notifications.show({
        title: "ไฟล์ไม่รองรับ",
        message: "กรุณาอัปโหลดไฟล์ JPG, PNG หรือ WebP เท่านั้น",
        color: "red",
      });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      notifications.show({
        title: "ไฟล์ใหญ่เกินไป",
        message: "ขนาดไฟล์ต้องไม่เกิน 5MB",
        color: "red",
      });
      return;
    }

    setSlipFile(file);
    setSlipPreview(URL.createObjectURL(file));
  };

  const handleSubmitSlip = async () => {
    if (!slipFile || !order) return;

    setSubmitting(true);
    try {
      // 1. Upload slip image
      const formData = new FormData();
      formData.append("file", slipFile);
      formData.append("folder", "slip");

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        throw new Error(err.error || "อัปโหลดไม่สำเร็จ");
      }

      const { url } = await uploadRes.json();

      // 2. Update payment with slip
      const payRes = await fetch(`/api/user/orders/${order.id}/payment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slipImage: url }),
      });

      if (!payRes.ok) {
        const err = await payRes.json();
        throw new Error(err.error || "ไม่สามารถบันทึกข้อมูลได้");
      }

      notifications.show({
        title: "ส่งสลิปสำเร็จ",
        message: "เราได้รับสลิปของคุณแล้ว รอการตรวจสอบจากทางร้าน",
        color: "green",
        icon: <IconCheck size={16} />,
        autoClose: 5000,
      });

      // Refresh order data
      fetchOrder();
      setSlipFile(null);
    } catch (error) {
      notifications.show({
        title: "เกิดข้อผิดพลาด",
        message:
          error instanceof Error ? error.message : "ไม่สามารถอัปโหลดสลิปได้",
        color: "red",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <Container size="sm" py={80}>
        <Stack align="center" gap="md">
          <Loader color="green" />
          <Text c="dimmed">กำลังโหลด...</Text>
        </Stack>
      </Container>
    );
  }

  if (!order) return null;

  const isPaid = order.status !== "PENDING";
  const hasSlip = !!order.payment?.slipImage;

  return (
    <Container size="sm" py="xl">
      <Text size="xl" fw={700} mb="lg">
        ชำระเงิน
      </Text>

      <Stack gap="lg">
        {/* Order info */}
        <Paper withBorder radius="md" p="md">
          <Group justify="space-between" mb="xs">
            <Group gap="xs">
              <IconReceipt size={18} color="var(--mantine-color-green-6)" />
              <Text size="sm" fw={600}>
                คำสั่งซื้อ {order.orderNumber}
              </Text>
            </Group>
            <Badge
              color={
                order.status === "PENDING"
                  ? "yellow"
                  : order.status === "PAID"
                    ? "blue"
                    : order.status === "PROCESSING"
                      ? "cyan"
                      : order.status === "SHIPPED"
                        ? "indigo"
                        : order.status === "DELIVERED"
                          ? "green"
                          : "red"
              }
              variant="light"
            >
              {order.status === "PENDING"
                ? "รอชำระเงิน"
                : order.status === "PAID"
                  ? "รอตรวจสอบ"
                  : order.status === "PROCESSING"
                    ? "กำลังจัดเตรียม"
                    : order.status === "SHIPPED"
                      ? "จัดส่งแล้ว"
                      : order.status === "DELIVERED"
                        ? "สำเร็จ"
                        : "ยกเลิก"}
            </Badge>
          </Group>

          <Stack gap="xs">
            {order.items.map((item) => {
              const imgUrl = item.product.images?.[0]?.url;
              return (
                <Group key={item.id} gap="sm" wrap="nowrap">
                  <Box
                    pos="relative"
                    w={40}
                    h={40}
                    bg="gray.0"
                    style={{
                      borderRadius: "var(--mantine-radius-sm)",
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
                          size={14}
                          color="var(--mantine-color-gray-4)"
                        />
                      </Box>
                    )}
                  </Box>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Text size="xs" lineClamp={1}>
                      {item.product.name}
                    </Text>
                    <Text size="xs" c="dimmed">
                      x{item.quantity}
                    </Text>
                  </div>
                  <Text size="xs" fw={600} style={{ flexShrink: 0 }}>
                    ฿{Number(item.subtotal).toLocaleString()}
                  </Text>
                </Group>
              );
            })}
          </Stack>

          <Divider my="sm" />
          <Group justify="space-between">
            <Text size="sm" fw={600}>
              ยอดชำระทั้งหมด
            </Text>
            <Text size="lg" fw={700} c="green.7">
              ฿{Number(order.totalAmount).toLocaleString()}
            </Text>
          </Group>
        </Paper>

        {/* QR Code / Payment Info */}
        {!isPaid && (
          <Paper withBorder radius="md" p="md">
            <Text size="sm" fw={600} mb="sm" ta="center">
              สแกน QR Code เพื่อชำระเงิน
            </Text>
            <Box
              mx="auto"
              pos="relative"
              w={280}
              h={280}
              style={{
                borderRadius: "var(--mantine-radius-md)",
                overflow: "hidden",
              }}
            >
              <Image
                src="/img/checkout.png"
                alt="PromptPay QR Code"
                fill
                style={{ objectFit: "contain" }}
              />
            </Box>
            <Text size="lg" fw={700} ta="center" mt="sm" c="green.7">
              ฿{Number(order.totalAmount).toLocaleString()}
            </Text>
            <Text size="xs" c="dimmed" ta="center" mt={4}>
              กรุณาโอนเงินตามจำนวนที่ระบุ แล้วอัปโหลดสลิปด้านล่าง
            </Text>
          </Paper>
        )}

        {/* Slip upload */}
        {!isPaid && (
          <Paper withBorder radius="md" p="md">
            <Text size="sm" fw={600} mb="sm">
              อัปโหลดสลิปการโอนเงิน
            </Text>

            {slipPreview && (
              <Box
                mx="auto"
                mb="sm"
                pos="relative"
                w={200}
                h={280}
                style={{
                  borderRadius: "var(--mantine-radius-md)",
                  overflow: "hidden",
                  border: "1px solid var(--mantine-color-gray-3)",
                }}
              >
                <Image
                  src={slipPreview}
                  alt="สลิปการโอนเงิน"
                  fill
                  style={{ objectFit: "contain" }}
                />
              </Box>
            )}

            <Stack gap="sm" align="center">
              <FileButton
                resetRef={resetRef}
                onChange={handleFileSelect}
                accept="image/jpeg,image/png,image/webp"
              >
                {(props) => (
                  <Button
                    {...props}
                    variant="light"
                    color="green"
                    radius="md"
                    leftSection={<IconPhoto size={16} />}
                  >
                    {slipPreview ? "เปลี่ยนรูปสลิป" : "เลือกรูปสลิป"}
                  </Button>
                )}
              </FileButton>

              {slipFile && (
                <Button
                  color="green"
                  radius="md"
                  size="md"
                  fullWidth
                  onClick={handleSubmitSlip}
                  loading={submitting}
                  leftSection={<IconUpload size={16} />}
                >
                  ส่งสลิปการโอนเงิน
                </Button>
              )}
            </Stack>
          </Paper>
        )}

        {/* Already paid */}
        {isPaid && hasSlip && (
          <Alert
            color="green"
            variant="light"
            icon={<IconCheck size={18} />}
            radius="md"
            title="ส่งสลิปเรียบร้อยแล้ว"
          >
            <Text size="sm">
              {order.status === "PAID"
                ? "เราได้รับสลิปของคุณแล้ว กำลังตรวจสอบ กรุณารอสักครู่"
                : "การชำระเงินได้รับการยืนยันแล้ว"}
            </Text>
            {order.payment?.slipImage && (
              <Box
                mt="sm"
                pos="relative"
                w={150}
                h={200}
                style={{
                  borderRadius: "var(--mantine-radius-sm)",
                  overflow: "hidden",
                  border: "1px solid var(--mantine-color-gray-3)",
                }}
              >
                <Image
                  src={order.payment.slipImage}
                  alt="สลิปที่ส่งแล้ว"
                  fill
                  style={{ objectFit: "contain" }}
                />
              </Box>
            )}
          </Alert>
        )}

        {/* Navigation */}
        {/* <Group justify="center">
          <Button
            component={Link}
            href="/orders"
            variant="light"
            color="green"
            radius="md"
          >
            ดูคำสั่งซื้อทั้งหมด
          </Button>
          <Button
            component={Link}
            href="/products"
            variant="subtle"
            color="green"
            radius="md"
          >
            เลือกซื้อเพิ่ม
          </Button>
        </Group> */}
      </Stack>
    </Container>
  );
}
