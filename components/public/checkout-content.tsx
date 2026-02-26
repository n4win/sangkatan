"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Container,
  Text,
  Stack,
  Group,
  Paper,
  Button,
  TextInput,
  Textarea,
  Loader,
  Box,
  Divider,
  Badge,
  Alert,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconShoppingBag,
  IconMapPin,
  IconArrowLeft,
  IconCheck,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { dispatchCartUpdate } from "@/utils/cartEvents";

interface CartItemProduct {
  id: string;
  name: string;
  slug: string;
  price: string;
  stock: number;
  isActive: boolean;
  images: { url: string; alt: string | null }[];
}

interface CartItem {
  id: string;
  quantity: number;
  product: CartItemProduct;
}

interface UserProfile {
  name: string | null;
  phone: string | null;
  address: string | null;
}

export function CheckoutContent() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [shippingName, setShippingName] = useState("");
  const [shippingPhone, setShippingPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [note, setNote] = useState("");

  const itemIds = searchParams.get("items")?.split(",").filter(Boolean) ?? [];

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin?callbackUrl=/cart");
      return;
    }
    if (status === "authenticated") {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const fetchData = async () => {
    try {
      // ดึงข้อมูลตะกร้าและ profile พร้อมกัน
      const [cartRes, profileRes] = await Promise.all([
        fetch("/api/cart"),
        fetch("/api/user/profile"),
      ]);
      const cartData = await cartRes.json();
      const profileData: UserProfile = await profileRes.json();

      // กรองเฉพาะ items ที่เลือก
      const allItems: CartItem[] = cartData?.items ?? [];
      const selected = allItems.filter((item: CartItem) =>
        itemIds.includes(item.id),
      );

      if (selected.length === 0) {
        router.push("/cart");
        return;
      }

      setItems(selected);

      // Pre-fill shipping info จาก profile
      if (profileData.name) setShippingName(profileData.name);
      if (profileData.phone) setShippingPhone(profileData.phone);
      if (profileData.address) setShippingAddress(profileData.address);
    } catch {
      router.push("/cart");
    } finally {
      setLoading(false);
    }
  };

  const totalPrice = items.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0,
  );

  const handleSubmit = async () => {
    if (!shippingName.trim()) {
      notifications.show({
        title: "กรุณากรอกข้อมูล",
        message: "กรุณาระบุชื่อผู้รับ",
        color: "yellow",
      });
      return;
    }
    if (!shippingPhone.trim()) {
      notifications.show({
        title: "กรุณากรอกข้อมูล",
        message: "กรุณาระบุเบอร์โทรศัพท์",
        color: "yellow",
      });
      return;
    }
    if (!shippingAddress.trim()) {
      notifications.show({
        title: "กรุณากรอกข้อมูล",
        message: "กรุณาระบุที่อยู่จัดส่ง",
        color: "yellow",
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartItemIds: items.map((item) => item.id),
          shippingName: shippingName.trim(),
          shippingPhone: shippingPhone.trim(),
          shippingAddress: shippingAddress.trim(),
          note: note.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        notifications.show({
          title: "ไม่สามารถสั่งซื้อได้",
          message: data.error || "เกิดข้อผิดพลาด",
          color: "red",
          icon: <IconAlertTriangle size={16} />,
        });
        return;
      }

      dispatchCartUpdate();
      router.push(`/orders/${data.orderId}/payment`);
    } catch {
      notifications.show({
        title: "เกิดข้อผิดพลาด",
        message: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้",
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

  return (
    <Container size="sm" py="xl">
      <Group mb="xl" gap="xs">
        <Button
          component={Link}
          href="/cart"
          variant="subtle"
          color="gray"
          size="compact-sm"
          leftSection={<IconArrowLeft size={14} />}
        >
          กลับไปตะกร้า
        </Button>
      </Group>

      <Text size="xl" fw={700} mb="lg">
        ยืนยันการสั่งซื้อ
      </Text>

      <Stack gap="lg">
        {/* สรุปสินค้า */}
        <Paper withBorder radius="md" p="md">
          <Text size="sm" fw={600} mb="sm">
            สินค้าที่สั่งซื้อ ({items.length} รายการ)
          </Text>
          <Stack gap="sm">
            {items.map((item) => {
              const imgUrl = item.product.images?.[0]?.url;
              return (
                <Group key={item.id} gap="sm" wrap="nowrap" align="center">
                  <Box
                    pos="relative"
                    w={50}
                    h={50}
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
                          size={18}
                          color="var(--mantine-color-gray-4)"
                        />
                      </Box>
                    )}
                  </Box>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Text size="xs" fw={500} lineClamp={1}>
                      {item.product.name}
                    </Text>
                    <Group gap={4}>
                      <Text size="xs" c="dimmed">
                        ฿{Number(item.product.price).toLocaleString()} x{" "}
                        {item.quantity}
                      </Text>
                    </Group>
                  </div>
                  <Text size="sm" fw={600} style={{ flexShrink: 0 }}>
                    ฿
                    {(
                      Number(item.product.price) * item.quantity
                    ).toLocaleString()}
                  </Text>
                </Group>
              );
            })}
          </Stack>
          <Divider my="sm" />
          <Group justify="space-between">
            <Text size="sm" fw={600}>
              รวมทั้งหมด
            </Text>
            <Text size="lg" fw={700} c="green.7">
              ฿{totalPrice.toLocaleString()}
            </Text>
          </Group>
        </Paper>

        {/* ข้อมูลจัดส่ง */}
        <Paper withBorder radius="md" p="md">
          <Group gap="xs" mb="sm">
            <IconMapPin size={18} color="var(--mantine-color-green-6)" />
            <Text size="sm" fw={600}>
              ข้อมูลจัดส่ง
            </Text>
          </Group>

          <Stack gap="sm">
            <TextInput
              label="ชื่อผู้รับ"
              placeholder="ชื่อ-นามสกุล"
              value={shippingName}
              onChange={(e) => setShippingName(e.currentTarget.value)}
              required
            />
            <TextInput
              label="เบอร์โทรศัพท์"
              placeholder="0xx-xxx-xxxx"
              value={shippingPhone}
              onChange={(e) => setShippingPhone(e.currentTarget.value)}
              required
            />
            <Textarea
              label="ที่อยู่จัดส่ง"
              placeholder="บ้านเลขที่ ซอย ถนน ตำบล อำเภอ จังหวัด รหัสไปรษณีย์"
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.currentTarget.value)}
              minRows={3}
              required
            />
            <Textarea
              label="หมายเหตุ (ถ้ามี)"
              placeholder="เช่น ทำสังฆทานมอบให้วัดทั้งหมด"
              value={note}
              onChange={(e) => setNote(e.currentTarget.value)}
              minRows={2}
            />
          </Stack>
        </Paper>

        {/* วิธีชำระเงิน */}
        <Paper withBorder radius="md" p="md">
          <Text size="sm" fw={600} mb="xs">
            วิธีชำระเงิน
          </Text>
          <Badge color="green" variant="light" size="lg">
            PromptPay / โอนเงิน
          </Badge>
          <Text size="xs" c="dimmed" mt={4}>
            หลังยืนยันสั่งซื้อ ระบบจะแสดง QR Code สำหรับชำระเงิน
          </Text>
        </Paper>

        {/* ปุ่มยืนยัน */}
        <Button
          color="green"
          size="lg"
          radius="md"
          fullWidth
          onClick={handleSubmit}
          loading={submitting}
          leftSection={<IconCheck size={18} />}
        >
          ยืนยันสั่งซื้อ (฿{totalPrice.toLocaleString()})
        </Button>
      </Stack>
    </Container>
  );
}
