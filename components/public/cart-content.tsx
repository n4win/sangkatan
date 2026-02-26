"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Container,
  Text,
  Stack,
  Group,
  Paper,
  Button,
  ActionIcon,
  NumberInput,
  Loader,
  Divider,
  Box,
  Alert,
  Badge,
  Modal,
  Checkbox,
  Affix,
  Transition,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconShoppingCart,
  IconTrash,
  IconMinus,
  IconPlus,
  IconArrowLeft,
  IconCheck,
  IconShoppingBag,
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

interface Cart {
  id: string;
  items: CartItem[];
  warnings?: string[];
}

export function CartContent() {
  const { status } = useSession();
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {},
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [stockLimitModal, setStockLimitModal] = useState<{
    opened: boolean;
    productName: string;
    stock: number;
  }>({ opened: false, productName: "", stock: 0 });

  const showStockLimitModal = (productName: string, stock: number) => {
    setStockLimitModal({ opened: true, productName, stock });
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin?callbackUrl=/cart");
      return;
    }
    if (status === "authenticated") {
      fetchCart();
    }
  }, [status, router]);

  const fetchCart = async () => {
    try {
      const res = await fetch("/api/cart");
      const data = await res.json();
      setCart(data);
      // แสดง warnings จาก backend (เช่น stock ถูกปรับอัตโนมัติ)
      if (data?.warnings?.length) {
        data.warnings.forEach((msg: string) => {
          notifications.show({
            title: "แจ้งเตือน",
            message: msg,
            color: "yellow",
            icon: <IconAlertTriangle size={16} />,
            autoClose: 5000,
          });
        });
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  // อัปเดต local state ทันที
  const setLocalQuantity = useCallback((itemId: string, quantity: number) => {
    setCart((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map((item) =>
          item.id === itemId ? { ...item, quantity } : item,
        ),
      };
    });
  }, []);

  // ส่ง API จริง + refetch ถ้า stock ไม่พอ
  const syncQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      setUpdatingId(itemId);
      try {
        const res = await fetch(`/api/cart/${itemId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity }),
        });
        if (res.ok) {
          dispatchCartUpdate();
        } else {
          const data = await res.json();
          notifications.show({
            title: "สินค้าคงเหลือไม่พอ",
            message: data.error || "ไม่สามารถอัปเดตจำนวนได้",
            color: "yellow",
            icon: <IconAlertTriangle size={16} />,
          });
          // refetch เพื่อดึง stock จริงกลับมา
          fetchCart();
        }
      } catch {
        notifications.show({
          title: "เกิดข้อผิดพลาด",
          message: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้",
          color: "red",
        });
      } finally {
        setUpdatingId(null);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // อัปเดตจำนวน: เปลี่ยน local ทันที + debounce API 600ms + เช็ค stock limit
  const updateQuantity = useCallback(
    (itemId: string, quantity: number, productName: string, stock: number) => {
      if (quantity > stock) {
        showStockLimitModal(productName, stock);
        quantity = stock;
      }
      setLocalQuantity(itemId, quantity);
      if (debounceTimers.current[itemId]) {
        clearTimeout(debounceTimers.current[itemId]);
      }
      debounceTimers.current[itemId] = setTimeout(() => {
        syncQuantity(itemId, quantity);
      }, 600);
    },
    [setLocalQuantity, syncQuantity],
  );

  const removeItem = async (itemId: string) => {
    setDeletingId(itemId);
    try {
      const res = await fetch(`/api/cart/${itemId}`, { method: "DELETE" });
      if (res.ok) {
        setCart((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            items: prev.items.filter((item) => item.id !== itemId),
          };
        });
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(itemId);
          return next;
        });
        dispatchCartUpdate();
        notifications.show({
          title: "ลบสินค้าแล้ว",
          message: "นำสินค้าออกจากตะกร้าแล้ว",
          color: "green",
          icon: <IconCheck size={16} />,
        });
      }
    } catch {
      notifications.show({
        title: "เกิดข้อผิดพลาด",
        message: "ไม่สามารถลบสินค้าได้",
        color: "red",
      });
    } finally {
      setDeletingId(null);
    }
  };

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

  const items = cart?.items ?? [];
  const validItems = items.filter(
    (item) => item.product.isActive && item.product.stock > 0,
  );
  const problemItems = items.filter(
    (item) => !item.product.isActive || item.product.stock === 0,
  );

  // Shopee-style: คำนวณเฉพาะสินค้าที่ถูกเลือก
  const selectedValidItems = validItems.filter((item) =>
    selectedIds.has(item.id),
  );
  const selectedTotalPrice = selectedValidItems.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0,
  );
  const selectedCount = selectedValidItems.length;

  const allSelected =
    validItems.length > 0 &&
    validItems.every((item) => selectedIds.has(item.id));

  const toggleSelect = (itemId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(validItems.map((item) => item.id)));
    }
  };

  const handleCheckout = () => {
    const itemIds = Array.from(selectedIds).join(",");
    router.push(`/checkout?items=${itemIds}`);
  };

  return (
    <Container size="md" py="xl" pb={items.length > 0 ? 100 : "xl"}>
      <Group mb="xl" gap="xs">
        <IconShoppingCart size={24} />
        <Text size="xl" fw={700}>
          ตะกร้าสินค้า
        </Text>
        {items.length > 0 && (
          <Text size="sm" c="dimmed">
            ({validItems.length} รายการ)
          </Text>
        )}
      </Group>

      {items.length === 0 ? (
        <Paper withBorder radius="md" p={60}>
          <Stack align="center" gap="md">
            <IconShoppingCart size={48} color="var(--mantine-color-gray-4)" />
            <Text c="dimmed" size="lg">
              ตะกร้าสินค้าว่างเปล่า
            </Text>
            <Button
              component={Link}
              href="/products"
              variant="light"
              color="green"
              radius="md"
              leftSection={<IconShoppingBag size={16} />}
            >
              เลือกซื้อสินค้า
            </Button>
          </Stack>
        </Paper>
      ) : (
        <Stack gap="md">
          {/* สินค้าที่มีปัญหา (หมด/ปิดการขาย) */}
          {problemItems.length > 0 && (
            <Alert
              color="yellow"
              variant="light"
              icon={<IconAlertTriangle size={18} />}
              radius="md"
              title="สินค้าบางรายการไม่พร้อมจำหน่าย"
            >
              <Stack gap={4}>
                {problemItems.map((item) => (
                  <Group key={item.id} justify="space-between">
                    <Text size="sm">
                      {item.product.name} —{" "}
                      {!item.product.isActive
                        ? "สินค้าถูกปิดการขาย"
                        : "สินค้าหมด"}
                    </Text>
                    <ActionIcon
                      variant="light"
                      color="red"
                      size="sm"
                      radius="md"
                      onClick={() => removeItem(item.id)}
                      loading={deletingId === item.id}
                    >
                      <IconTrash size={12} />
                    </ActionIcon>
                  </Group>
                ))}
              </Stack>
            </Alert>
          )}

          {/* Header: เลือกทั้งหมด */}
          {validItems.length > 0 && (
            <Paper withBorder radius="md" px="md" py="sm">
              <Group gap="sm">
                <Checkbox
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  color="green"
                  size="sm"
                />
                <Text size="sm" fw={500}>
                  เลือกทั้งหมด ({validItems.length})
                </Text>
              </Group>
            </Paper>
          )}

          {/* สินค้าปกติ */}
          {validItems.map((item) => {
            const imgUrl = item.product.images?.[0]?.url;
            const isSelected = selectedIds.has(item.id);
            return (
              <Paper
                key={item.id}
                withBorder
                radius="md"
                p="md"
                style={{
                  borderColor: isSelected
                    ? "var(--mantine-color-green-4)"
                    : undefined,
                  transition: "border-color 0.15s",
                }}
              >
                <Group gap="md" wrap="nowrap" align="flex-start">
                  <Checkbox
                    checked={isSelected}
                    onChange={() => toggleSelect(item.id)}
                    color="green"
                    size="sm"
                    style={{ alignSelf: "center" }}
                  />

                  <Box
                    pos="relative"
                    w={80}
                    h={80}
                    bg="gray.0"
                    style={{
                      borderRadius: "var(--mantine-radius-md)",
                      overflow: "hidden",
                      flexShrink: 0,
                    }}
                    component={Link}
                    href={`/products/${item.product.slug}`}
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
                          size={24}
                          color="var(--mantine-color-gray-4)"
                        />
                      </Box>
                    )}
                  </Box>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Text
                      size="sm"
                      fw={600}
                      lineClamp={2}
                      component={Link}
                      href={`/products/${item.product.slug}`}
                      style={{ textDecoration: "none", color: "inherit" }}
                    >
                      {item.product.name}
                    </Text>
                    <Group gap="xs" mt={2}>
                      <Text size="sm" fw={700} c="green.7">
                        ฿{Number(item.product.price).toLocaleString()}
                      </Text>
                      <Badge variant="light" color="gray" size="xs">
                        คงเหลือ {item.product.stock} ชิ้น
                      </Badge>
                    </Group>

                    <Group gap="xs" mt="xs">
                      <ActionIcon
                        variant="default"
                        radius="md"
                        onClick={() =>
                          updateQuantity(
                            item.id,
                            item.quantity - 1,
                            item.product.name,
                            item.product.stock,
                          )
                        }
                        disabled={item.quantity <= 1 || updatingId === item.id}
                      >
                        <IconMinus size={12} />
                      </ActionIcon>
                      <NumberInput
                        value={item.quantity}
                        onChange={(val) => {
                          const raw = Number(val) || 0;
                          if (raw < 1) return;
                          updateQuantity(
                            item.id,
                            raw,
                            item.product.name,
                            item.product.stock,
                          );
                        }}
                        min={1}
                        max={item.product.stock}
                        clampBehavior="strict"
                        w={50}
                        size="xs"
                        hideControls
                        styles={{
                          input: { textAlign: "center", fontWeight: 600 },
                        }}
                        disabled={updatingId === item.id}
                      />
                      <ActionIcon
                        variant="default"
                        radius="md"
                        onClick={() =>
                          updateQuantity(
                            item.id,
                            item.quantity + 1,
                            item.product.name,
                            item.product.stock,
                          )
                        }
                        disabled={
                          item.quantity >= item.product.stock ||
                          updatingId === item.id
                        }
                      >
                        <IconPlus size={12} />
                      </ActionIcon>
                    </Group>
                  </div>

                  <Stack
                    gap={0}
                    justify="space-between"
                    align="flex-end"
                    style={{ flexShrink: 0, alignSelf: "stretch" }}
                  >
                    <Text size="sm" fw={700} ta="right">
                      ฿
                      {(
                        Number(item.product.price) * item.quantity
                      ).toLocaleString()}
                    </Text>
                    <ActionIcon
                      variant="light"
                      color="red"
                      radius="md"
                      onClick={() => removeItem(item.id)}
                      loading={deletingId === item.id}
                    >
                      <IconTrash size={14} />
                    </ActionIcon>
                  </Stack>
                </Group>
              </Paper>
            );
          })}

          <Group justify="flex-start">
            <Button
              component={Link}
              href="/products"
              variant="subtle"
              color="green"
              leftSection={<IconArrowLeft size={16} />}
            >
              เลือกซื้อเพิ่ม
            </Button>
          </Group>
        </Stack>
      )}

      {/* Shopee-style sticky bottom bar */}
      <Affix position={{ bottom: 0, left: 0, right: 0 }}>
        <Transition mounted={items.length > 0} transition="slide-up">
          {(transitionStyles) => (
            <Paper
              shadow="xl"
              p="md"
              style={{
                ...transitionStyles,
                borderTop: "1px solid var(--mantine-color-gray-3)",
                borderRadius: 0,
              }}
            >
              <Container size="md">
                <Group justify="space-between" wrap="nowrap">
                  <Group gap="sm">
                    <Checkbox
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      color="green"
                      size="sm"
                    />
                    <Text size="sm" fw={500}>
                      เลือกทั้งหมด ({validItems.length})
                    </Text>
                  </Group>

                  <Group gap="md" wrap="nowrap">
                    <div style={{ textAlign: "right" }}>
                      <Text size="xs" c="dimmed">
                        รวม ({selectedCount} สินค้า):
                      </Text>
                      <Text size="lg" fw={700} c="green.7">
                        ฿{selectedTotalPrice.toLocaleString()}
                      </Text>
                    </div>
                    <Button
                      color="green"
                      radius="md"
                      size="md"
                      disabled={selectedCount === 0}
                      onClick={handleCheckout}
                    >
                      สั่งสินค้า
                    </Button>
                  </Group>
                </Group>
              </Container>
            </Paper>
          )}
        </Transition>
      </Affix>

      {/* Shopee-style stock limit modal */}
      <Modal
        opened={stockLimitModal.opened}
        onClose={() =>
          setStockLimitModal((prev) => ({ ...prev, opened: false }))
        }
        centered
        radius="md"
        withCloseButton={false}
        size="sm"
        overlayProps={{ backgroundOpacity: 0.4, blur: 2 }}
      >
        <Stack align="center" gap="md" py="md">
          <Text ta="center" size="sm">
            ขออภัย คุณสามารถซื้อสินค้านี้ได้เพียง{" "}
            <Text span fw={700} c="green.7">
              {stockLimitModal.stock}
            </Text>{" "}
            ชิ้น
          </Text>
          <Button
            color="green"
            radius="md"
            fullWidth
            onClick={() =>
              setStockLimitModal((prev) => ({ ...prev, opened: false }))
            }
          >
            ตกลง
          </Button>
        </Stack>
      </Modal>
    </Container>
  );
}
