"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Stack,
  Title,
  Group,
  TextInput,
  Paper,
  Badge,
  ActionIcon,
  Text,
  Select,
  Modal,
  Table,
  Divider,
  ThemeIcon,
  Tooltip,
  Avatar,
  Box,
  SimpleGrid,
  Image,
  Center,
  Button,
  CloseButton,
} from "@mantine/core";
import { Dropzone, IMAGE_MIME_TYPE } from "@mantine/dropzone";
import { useDisclosure } from "@mantine/hooks";
import { DataTable } from "mantine-datatable";
import {
  IconSearch,
  IconEye,
  IconFilter,
  IconTruck,
  IconPhone,
  IconMapPin,
  IconNote,
  IconCreditCard,
  IconReceipt,
  IconCalendar,
  IconPhoto,
  IconUpload,
  IconX,
  IconCamera,
  IconDeviceFloppy,
  IconPackage,
  IconCheck,
  IconBan,
} from "@tabler/icons-react";
import { NotificationService } from "@/utils/notificationService";
import { uploadImageFile } from "@/components/admin/image-upload";

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  subtotal: number;
  product: { id: string; name: string };
}

interface ProofImage {
  id?: string;
  url: string;
  caption: string | null;
  file?: File;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  note: string | null;
  shippingCarrier: string | null;
  trackingNumber: string | null;
  createdAt: string;
  user: { id: string; name: string | null; email: string | null };
  items: OrderItem[];
  payment: {
    id: string;
    method: string;
    status: string;
    amount: number;
    slipImage: string | null;
    paidAt: string | null;
  } | null;
  proofImages: ProofImage[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const ORDER_STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: "รอดำเนินการ", color: "yellow" },
  PAID: { label: "ชำระแล้ว", color: "blue" },
  PROCESSING: { label: "กำลังจัดเตรียม", color: "indigo" },
  SHIPPED: { label: "จัดส่งแล้ว", color: "cyan" },
  DELIVERED: { label: "สำเร็จ", color: "green" },
  CANCELLED: { label: "ยกเลิก", color: "red" },
};

const PAYMENT_METHOD_MAP: Record<string, string> = {
  BANK_TRANSFER: "โอนเงิน",
  PROMPTPAY: "พร้อมเพย์",
  CREDIT_CARD: "บัตรเครดิต",
};

const PAYMENT_STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: "รอชำระ", color: "yellow" },
  COMPLETED: { label: "ชำระแล้ว", color: "green" },
  FAILED: { label: "ล้มเหลว", color: "red" },
};

const PAGE_SIZE = 10;

export function OrdersContent() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [opened, { open, close }] = useDisclosure(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Shipping & proof image editing state
  const [editCarrier, setEditCarrier] = useState("");
  const [editTracking, setEditTracking] = useState("");
  const [editProofImages, setEditProofImages] = useState<ProofImage[]>([]);
  const [saving, setSaving] = useState(false);

  const fetchOrders = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(PAGE_SIZE),
        });
        if (search) params.set("search", search);
        if (filterStatus) params.set("status", filterStatus);

        const res = await fetch(`/api/admin/orders?${params}`);
        const json = await res.json();
        setOrders(json.data);
        setPagination(json.pagination);
      } catch {
        NotificationService.error("ไม่สามารถโหลดข้อมูลออเดอร์ได้");
      } finally {
        setLoading(false);
      }
    },
    [search, filterStatus],
  );

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleView = async (order: Order) => {
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`);
      const detail = await res.json();
      setSelectedOrder(detail);
      setEditCarrier(detail.shippingCarrier ?? "");
      setEditTracking(detail.trackingNumber ?? "");
      setEditProofImages(
        (detail.proofImages ?? []).map((img: ProofImage) => ({
          id: img.id,
          url: img.url,
          caption: img.caption,
        })),
      );
      open();
    } catch {
      NotificationService.error("ไม่สามารถโหลดรายละเอียดออเดอร์ได้");
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const loadingId = NotificationService.loading("กำลังอัปเดตสถานะ...");
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      NotificationService.updateToSuccess(loadingId, {
        message: "อัปเดตสถานะสำเร็จ",
      });
      fetchOrders(pagination.page);
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) =>
          prev ? { ...prev, status: newStatus } : null,
        );
      }
    } catch {
      NotificationService.updateToError(loadingId, {
        message: "ไม่สามารถอัปเดตสถานะได้",
      });
    }
  };

  const handleSaveShippingAndProof = async () => {
    if (!selectedOrder) return;
    setSaving(true);
    const loadingId = NotificationService.loading("กำลังบันทึก...");
    try {
      // Upload new proof images (those with file property)
      const uploadedProofImages: { url: string; caption: string | null }[] = [];
      for (const img of editProofImages) {
        if (img.file) {
          const url = await uploadImageFile(img.file, "proof");
          uploadedProofImages.push({ url, caption: img.caption });
        } else {
          uploadedProofImages.push({ url: img.url, caption: img.caption });
        }
      }

      const res = await fetch(`/api/admin/orders/${selectedOrder.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shippingCarrier: editCarrier,
          trackingNumber: editTracking,
          proofImages: uploadedProofImages,
        }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setSelectedOrder(updated);
      setEditProofImages(
        (updated.proofImages ?? []).map((img: ProofImage) => ({
          id: img.id,
          url: img.url,
          caption: img.caption,
        })),
      );
      NotificationService.updateToSuccess(loadingId, {
        message: "บันทึกข้อมูลสำเร็จ",
      });
      fetchOrders(pagination.page);
    } catch {
      NotificationService.updateToError(loadingId, {
        message: "ไม่สามารถบันทึกข้อมูลได้",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePaymentStatusChange = async (paymentStatus: string) => {
    if (!selectedOrder) return;
    const actionLabel = paymentStatus === "COMPLETED" ? "ยืนยัน" : "ปฏิเสธ";
    const loadingId = NotificationService.loading(
      `กำลัง${actionLabel}การชำระเงิน...`,
    );
    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentStatus,
          ...(paymentStatus === "COMPLETED" ? { status: "PAID" } : {}),
        }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setSelectedOrder(updated);
      NotificationService.updateToSuccess(loadingId, {
        message: `${actionLabel}การชำระเงินสำเร็จ`,
      });
      fetchOrders(pagination.page);
    } catch {
      NotificationService.updateToError(loadingId, {
        message: `ไม่สามารถ${actionLabel}การชำระเงินได้`,
      });
    }
  };

  const handleAddProofImages = (files: File[]) => {
    const remaining = 10 - editProofImages.length;
    const filesToAdd = files.slice(0, remaining);
    if (filesToAdd.length === 0) {
      NotificationService.error("เลือกได้สูงสุด 10 รูป");
      return;
    }
    const newImages: ProofImage[] = filesToAdd.map((file) => ({
      url: URL.createObjectURL(file),
      caption: null,
      file,
    }));
    setEditProofImages((prev) => [...prev, ...newImages]);
  };

  const handleRemoveProofImage = (index: number) => {
    setEditProofImages((prev) => {
      const img = prev[index];
      if (img.url.startsWith("blob:")) URL.revokeObjectURL(img.url);
      return prev.filter((_, i) => i !== index);
    });
  };

  const statusOptions = Object.entries(ORDER_STATUS_MAP).map(
    ([value, { label }]) => ({ value, label }),
  );

  const CARRIER_OPTIONS = [
    { value: "THAILAND_POST", label: "ไปรษณีย์ไทย" },
    { value: "KERRY", label: "Kerry Express" },
    { value: "FLASH", label: "Flash Express" },
    { value: "J&T", label: "J&T Express" },
    { value: "SHOPEE", label: "Shopee Express" },
    { value: "NINJA", label: "Ninja Van" },
    { value: "BEST", label: "Best Express" },
    { value: "DHL", label: "DHL" },
    { value: "SELF", label: "จัดส่งเอง" },
  ];

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-end">
        <div>
          <Text size="sm" c="dimmed">
            คำสั่งซื้อทั้งหมด {pagination.total} รายการ
          </Text>
          <Title order={2}>จัดการออเดอร์</Title>
        </div>
      </Group>

      <Paper withBorder p="lg" radius="md" shadow="xs">
        <Group mb="lg" gap="sm">
          <TextInput
            placeholder="ค้นหาหมายเลข, ชื่อลูกค้า..."
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            style={{ flex: 1 }}
            radius="md"
          />
          <Select
            placeholder="ทุกสถานะ"
            data={statusOptions}
            value={filterStatus}
            onChange={setFilterStatus}
            clearable
            leftSection={<IconFilter size={16} />}
            w={200}
            radius="md"
          />
        </Group>

        <DataTable
          withTableBorder
          borderRadius="md"
          striped
          highlightOnHover
          minHeight={300}
          fetching={loading}
          records={orders}
          idAccessor="id"
          shadow="none"
          columns={[
            {
              accessor: "orderNumber",
              title: "หมายเลข",
              width: 130,
              render: (order) => (
                <Text size="sm" fw={700} c="blue">
                  {order.orderNumber}
                </Text>
              ),
            },
            {
              accessor: "user.name",
              title: "ลูกค้า",
              width: "25%",
              render: (order) => (
                <Group gap="xs">
                  <Avatar size="sm" radius="xl" color="green">
                    {(order.user.name ??
                      order.user.email ??
                      "?")[0]?.toUpperCase()}
                  </Avatar>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <Text size="sm" fw={500} lineClamp={1}>
                      {order.user.name ?? "-"}
                    </Text>
                    <Text size="xs" c="dimmed" lineClamp={1}>
                      {order.user.email}
                    </Text>
                  </div>
                </Group>
              ),
            },
            {
              accessor: "items",
              title: "รายการ",
              width: 60,
              textAlign: "center",
              render: (order) => (
                <Badge variant="light" color="gray" size="md" radius="md">
                  {order.items.length}
                </Badge>
              ),
            },
            {
              accessor: "status",
              title: "สถานะ",
              textAlign: "center",
              width: 130,
              render: (order) => {
                const info = ORDER_STATUS_MAP[order.status] ?? {
                  label: order.status,
                  color: "gray",
                };
                return (
                  <Badge
                    color={info.color}
                    variant="light"
                    radius="md"
                    size="md"
                  >
                    {info.label}
                  </Badge>
                );
              },
            },
            {
              accessor: "totalAmount",
              title: "ยอดรวม",
              textAlign: "right",
              width: 120,
              render: (order) => (
                <Text size="sm" fw={700}>
                  ฿{Number(order.totalAmount).toLocaleString()}
                </Text>
              ),
            },
            {
              accessor: "payment",
              title: "การชำระ",
              textAlign: "center",
              width: 120,
              render: (order) =>
                order.payment ? (
                  <Badge
                    color={
                      order.payment.status === "COMPLETED" ? "green" : "yellow"
                    }
                    variant="dot"
                    size="sm"
                  >
                    {PAYMENT_METHOD_MAP[order.payment.method] ??
                      order.payment.method}
                  </Badge>
                ) : (
                  <Text size="xs" c="dimmed">
                    -
                  </Text>
                ),
            },
            {
              accessor: "createdAt",
              title: "วันที่",
              width: 100,
              render: (order) => (
                <Text size="xs" c="dimmed">
                  {new Date(order.createdAt).toLocaleDateString("th-TH", {
                    day: "numeric",
                    month: "short",
                    year: "2-digit",
                  })}
                </Text>
              ),
            },
            {
              accessor: "actions",
              title: "",
              textAlign: "center",
              width: 60,
              render: (order) => (
                <Tooltip label="ดูรายละเอียด">
                  <ActionIcon
                    variant="light"
                    color="blue"
                    size="md"
                    radius="md"
                    onClick={() => handleView(order)}
                  >
                    <IconEye size={15} />
                  </ActionIcon>
                </Tooltip>
              ),
            },
          ]}
          totalRecords={pagination.total}
          recordsPerPage={PAGE_SIZE}
          page={pagination.page}
          onPageChange={(p) => fetchOrders(p)}
          noRecordsText="ไม่พบออเดอร์"
          paginationText={({ from, to, totalRecords }) =>
            `แสดง ${from}–${to} จาก ${totalRecords} รายการ`
          }
        />
      </Paper>

      <Modal
        opened={opened}
        onClose={() => {
          close();
          setSelectedOrder(null);
        }}
        title={
          <Group gap="xs">
            <ThemeIcon color="blue" variant="light" size="md" radius="xl">
              <IconReceipt size={16} />
            </ThemeIcon>
            <Text fw={600}>ออเดอร์ #{selectedOrder?.orderNumber ?? ""}</Text>
          </Group>
        }
        size="lg"
        radius="lg"
      >
        {selectedOrder && (
          <Stack gap="md">
            <SimpleGrid cols={2}>
              <Paper withBorder p="md" radius="md" bg="gray.0">
                <Text size="xs" c="dimmed" tt="uppercase" fw={700} mb={4}>
                  สถานะออเดอร์
                </Text>
                <Select
                  data={statusOptions}
                  value={selectedOrder.status}
                  onChange={(v) => {
                    if (v) handleStatusChange(selectedOrder.id, v);
                  }}
                  radius="md"
                  size="sm"
                />
              </Paper>
              <Paper withBorder p="md" radius="md" bg="gray.0">
                <Text size="xs" c="dimmed" tt="uppercase" fw={700} mb={4}>
                  ยอดรวมทั้งหมด
                </Text>
                <Text size="xl" fw={700} c="green" lh={1}>
                  ฿{Number(selectedOrder.totalAmount).toLocaleString()}
                </Text>
                <Text size="xs" c="dimmed" mt={4}>
                  <IconCalendar
                    size={12}
                    style={{ verticalAlign: "middle", marginRight: 4 }}
                  />
                  {new Date(selectedOrder.createdAt).toLocaleString("th-TH")}
                </Text>
              </Paper>
            </SimpleGrid>

            <Paper withBorder p="md" radius="md">
              <Group gap={6} mb="sm">
                <ThemeIcon color="orange" variant="light" size="sm" radius="xl">
                  <IconTruck size={14} />
                </ThemeIcon>
                <Text fw={600} size="sm">
                  ข้อมูลจัดส่ง
                </Text>
              </Group>
              <SimpleGrid cols={2}>
                <Group gap="xs">
                  <IconTruck size={14} color="var(--mantine-color-gray-5)" />
                  <Text size="sm">{selectedOrder.shippingName}</Text>
                </Group>
                <Group gap="xs">
                  <IconPhone size={14} color="var(--mantine-color-gray-5)" />
                  <Text size="sm">{selectedOrder.shippingPhone}</Text>
                </Group>
              </SimpleGrid>
              <Group gap="xs" mt={6}>
                <IconMapPin size={14} color="var(--mantine-color-gray-5)" />
                <Text size="sm" style={{ flex: 1 }}>
                  {selectedOrder.shippingAddress}
                </Text>
              </Group>
              {selectedOrder.note && (
                <Group gap="xs" mt={6}>
                  <IconNote size={14} color="var(--mantine-color-yellow-6)" />
                  <Text size="sm" c="dimmed" fs="italic">
                    {selectedOrder.note}
                  </Text>
                </Group>
              )}
            </Paper>

            <Paper withBorder p="md" radius="md">
              <Group gap={6} mb="sm">
                <ThemeIcon color="teal" variant="light" size="sm" radius="xl">
                  <IconReceipt size={14} />
                </ThemeIcon>
                <Text fw={600} size="sm">
                  รายการสินค้า ({selectedOrder.items.length} รายการ)
                </Text>
              </Group>
              <Table striped highlightOnHover verticalSpacing="xs">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>สินค้า</Table.Th>
                    <Table.Th ta="center" w={70}>
                      จำนวน
                    </Table.Th>
                    <Table.Th ta="right" w={100}>
                      ราคา
                    </Table.Th>
                    <Table.Th ta="right" w={100}>
                      รวม
                    </Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {selectedOrder.items.map((item) => (
                    <Table.Tr key={item.id}>
                      <Table.Td>
                        <Text size="sm" fw={500}>
                          {item.product.name}
                        </Text>
                      </Table.Td>
                      <Table.Td ta="center">
                        <Badge variant="light" color="gray" size="sm">
                          x{item.quantity}
                        </Badge>
                      </Table.Td>
                      <Table.Td ta="right">
                        <Text size="sm">
                          ฿{Number(item.price).toLocaleString()}
                        </Text>
                      </Table.Td>
                      <Table.Td ta="right">
                        <Text size="sm" fw={600}>
                          ฿{Number(item.subtotal).toLocaleString()}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Paper>

            {selectedOrder.payment && (
              <Paper withBorder p="md" radius="md">
                <Group gap={6} mb="sm">
                  <ThemeIcon
                    color="indigo"
                    variant="light"
                    size="sm"
                    radius="xl"
                  >
                    <IconCreditCard size={14} />
                  </ThemeIcon>
                  <Text fw={600} size="sm">
                    การชำระเงิน
                  </Text>
                </Group>
                <SimpleGrid cols={3}>
                  <div>
                    <Text size="xs" c="dimmed">
                      วิธีชำระ
                    </Text>
                    <Text size="sm" fw={500}>
                      {PAYMENT_METHOD_MAP[selectedOrder.payment.method] ??
                        selectedOrder.payment.method}
                    </Text>
                  </div>
                  <div>
                    <Text size="xs" c="dimmed">
                      สถานะ
                    </Text>
                    <Badge
                      color={
                        PAYMENT_STATUS_MAP[selectedOrder.payment.status]
                          ?.color ?? "gray"
                      }
                      variant="light"
                      size="md"
                      mt={2}
                    >
                      {PAYMENT_STATUS_MAP[selectedOrder.payment.status]
                        ?.label ?? selectedOrder.payment.status}
                    </Badge>
                  </div>
                  <div>
                    <Text size="xs" c="dimmed">
                      ชำระเมื่อ
                    </Text>
                    <Text size="sm" fw={500}>
                      {selectedOrder.payment.paidAt
                        ? new Date(selectedOrder.payment.paidAt).toLocaleString(
                            "th-TH",
                          )
                        : "-"}
                    </Text>
                  </div>
                </SimpleGrid>
                {selectedOrder.payment.slipImage && (
                  <Box mt="sm">
                    <Text size="xs" c="dimmed" mb={4}>
                      สลิปการโอน
                    </Text>
                    <Image
                      src={selectedOrder.payment.slipImage}
                      alt="slip"
                      mah={200}
                      fit="contain"
                      radius="md"
                      fallbackSrc="https://placehold.co/400x200?text=No+Image"
                    />
                  </Box>
                )}
                {selectedOrder.payment.status === "PENDING" && (
                  <Group mt="md" gap="sm">
                    <Button
                      color="green"
                      variant="filled"
                      size="sm"
                      radius="md"
                      leftSection={<IconCheck size={16} />}
                      onClick={() => handlePaymentStatusChange("COMPLETED")}
                      style={{ flex: 1 }}
                    >
                      ยืนยันการชำระเงิน
                    </Button>
                    <Button
                      color="red"
                      variant="light"
                      size="sm"
                      radius="md"
                      leftSection={<IconBan size={16} />}
                      onClick={() => handlePaymentStatusChange("FAILED")}
                      style={{ flex: 1 }}
                    >
                      ปฏิเสธ
                    </Button>
                  </Group>
                )}
              </Paper>
            )}

            <Divider label="จัดการโดย Admin" labelPosition="center" />

            {/* Shipping Carrier & Tracking */}
            <Paper withBorder p="md" radius="md">
              <Group gap={6} mb="sm">
                <ThemeIcon color="cyan" variant="light" size="sm" radius="xl">
                  <IconPackage size={14} />
                </ThemeIcon>
                <Text fw={600} size="sm">
                  ข้อมูลจัดส่งพัสดุ
                </Text>
              </Group>
              <SimpleGrid cols={2}>
                <Select
                  label="บริษัทขนส่ง"
                  placeholder="เลือกบริษัทขนส่ง"
                  data={CARRIER_OPTIONS}
                  value={editCarrier}
                  onChange={(v) => setEditCarrier(v ?? "")}
                  clearable
                  radius="md"
                  size="sm"
                />
                <TextInput
                  label="เลข Tracking"
                  placeholder="กรอกเลข tracking"
                  value={editTracking}
                  onChange={(e) => setEditTracking(e.currentTarget.value)}
                  radius="md"
                  size="sm"
                />
              </SimpleGrid>
            </Paper>

            {/* Proof Images */}
            <Paper withBorder p="md" radius="md">
              <Group gap={6} mb="sm">
                <ThemeIcon color="pink" variant="light" size="sm" radius="xl">
                  <IconCamera size={14} />
                </ThemeIcon>
                <Text fw={600} size="sm">
                  หลักฐานการถวายสังฆทาน
                </Text>
              </Group>
              <Text size="xs" c="dimmed" mb="sm">
                อัปโหลดรูปภาพหลักฐานการถวายสังฆทาน / ส่งมอบสินค้าให้วัด
                เพื่อให้ผู้สั่งซื้อตรวจสอบ
              </Text>

              {editProofImages.length > 0 && (
                <SimpleGrid cols={{ base: 3, sm: 4 }} spacing="xs" mb="sm">
                  {editProofImages.map((img, index) => (
                    <Box
                      key={index}
                      pos="relative"
                      style={{
                        borderRadius: "var(--mantine-radius-md)",
                        overflow: "hidden",
                        border: "1px solid var(--mantine-color-gray-3)",
                      }}
                    >
                      <Image src={img.url} alt="proof" h={80} fit="cover" />
                      {img.file && (
                        <Badge
                          pos="absolute"
                          bottom={2}
                          left={2}
                          color="yellow"
                          variant="filled"
                          size="xs"
                          style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }}
                        >
                          ใหม่
                        </Badge>
                      )}
                      <CloseButton
                        pos="absolute"
                        top={4}
                        right={4}
                        size="xs"
                        variant="filled"
                        color="red"
                        radius="xl"
                        onClick={() => handleRemoveProofImage(index)}
                        style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }}
                      />
                    </Box>
                  ))}
                </SimpleGrid>
              )}

              {editProofImages.length < 10 && (
                <Dropzone
                  onDrop={handleAddProofImages}
                  accept={IMAGE_MIME_TYPE}
                  maxSize={5 * 1024 * 1024}
                  multiple
                  radius="md"
                  styles={{
                    root: {
                      minHeight: 70,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    },
                  }}
                >
                  <Stack
                    align="center"
                    gap={4}
                    style={{ pointerEvents: "none" }}
                  >
                    <Dropzone.Accept>
                      <IconUpload
                        size={20}
                        color="var(--mantine-color-blue-5)"
                      />
                    </Dropzone.Accept>
                    <Dropzone.Reject>
                      <IconX size={20} color="var(--mantine-color-red-5)" />
                    </Dropzone.Reject>
                    <Dropzone.Idle>
                      <IconPhoto
                        size={20}
                        color="var(--mantine-color-dimmed)"
                      />
                    </Dropzone.Idle>
                    <Text size="xs" c="dimmed">
                      คลิกหรือลากรูปมาวาง ({editProofImages.length}/10)
                    </Text>
                  </Stack>
                </Dropzone>
              )}
            </Paper>

            <Button
              fullWidth
              color="green"
              radius="md"
              leftSection={<IconDeviceFloppy size={16} />}
              loading={saving}
              onClick={handleSaveShippingAndProof}
            >
              บันทึกข้อมูลจัดส่ง & หลักฐาน
            </Button>
          </Stack>
        )}
      </Modal>
    </Stack>
  );
}
