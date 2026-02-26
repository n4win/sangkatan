"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Stack,
  Title,
  Group,
  Button,
  TextInput,
  Paper,
  Badge,
  ActionIcon,
  Text,
  Select,
  NumberInput,
  Textarea,
  Switch,
  Modal,
  SimpleGrid,
  Image,
  ThemeIcon,
  Box,
  Tooltip,
  Divider,
  rem,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { DataTable } from "mantine-datatable";
import {
  IconPlus,
  IconSearch,
  IconEdit,
  IconTrash,
  IconPackage,
  IconStar,
  IconFilter,
} from "@tabler/icons-react";
import { NotificationService } from "@/utils/notificationService";
import {
  MultiImageUpload,
  uploadImageFile,
  deleteImageFile,
} from "@/components/admin/image-upload";
import type { StagedImage } from "@/components/admin/image-upload";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  slug: string;
  isActive: boolean;
  isFeatured: boolean;
  categoryId: string | null;
  category: { id: string; name: string } | null;
  images: { id: string; url: string; alt: string | null }[];
  _count: { reviews: number; orderItems: number };
  createdAt: string;
}

interface Category {
  id: string;
  name: string;
  _count: { products: number };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const PAGE_SIZE = 10;

export function ProductsContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [opened, { open, close }] = useDisclosure(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const deletedUrlsRef = useRef<string[]>([]);

  const form = useForm({
    initialValues: {
      name: "",
      description: "",
      price: 0,
      stock: 0,
      categoryId: "" as string | null,
      isActive: true,
      isFeatured: false,
      images: [] as StagedImage[],
    },
    validate: {
      name: (v) => (v.trim() ? null : "กรุณาระบุชื่อสินค้า"),
      price: (v) => (v > 0 ? null : "ราคาต้องมากกว่า 0"),
    },
  });

  const fetchProducts = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(PAGE_SIZE),
        });
        if (search) params.set("search", search);
        if (filterCategory) params.set("categoryId", filterCategory);

        const res = await fetch(`/api/admin/products?${params}`);
        const json = await res.json();
        setProducts(json.data);
        setPagination(json.pagination);
      } catch {
        NotificationService.error("ไม่สามารถโหลดข้อมูลสินค้าได้");
      } finally {
        setLoading(false);
      }
    },
    [search, filterCategory],
  );

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/categories");
      const json = await res.json();
      setCategories(json);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);

  const resetFormState = () => {
    form.reset();
    setEditingId(null);
    deletedUrlsRef.current = [];
  };

  const handleSubmit = async (values: typeof form.values) => {
    const loadingId = NotificationService.loading(
      editingId ? "กำลังแก้ไขสินค้า..." : "กำลังสร้างสินค้า...",
    );
    try {
      const uploadedImages = await Promise.all(
        values.images.map(async (img) => {
          if (img.file) {
            const url = await uploadImageFile(img.file, "product");
            return { url, alt: img.alt ?? "" };
          }
          return { url: img.url, alt: img.alt ?? "" };
        }),
      );

      await Promise.all(deletedUrlsRef.current.map((u) => deleteImageFile(u)));

      const url = editingId
        ? `/api/admin/products/${editingId}`
        : "/api/admin/products";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, images: uploadedImages }),
      });
      if (!res.ok) throw new Error();

      NotificationService.updateToSuccess(loadingId, {
        message: editingId ? "แก้ไขสินค้าสำเร็จ" : "สร้างสินค้าสำเร็จ",
      });
      close();
      resetFormState();
      fetchProducts(pagination.page);
    } catch {
      NotificationService.updateToError(loadingId, {
        message: "เกิดข้อผิดพลาด กรุณาลองใหม่",
      });
    }
  };

  const handleEdit = async (product: Product) => {
    resetFormState();
    setEditingId(product.id);
    open();

    try {
      const res = await fetch(`/api/admin/products/${product.id}`);
      const fullProduct = await res.json();

      form.setValues({
        name: fullProduct.name,
        description: fullProduct.description ?? "",
        price: Number(fullProduct.price),
        stock: fullProduct.stock,
        categoryId: fullProduct.categoryId,
        isActive: fullProduct.isActive,
        isFeatured: fullProduct.isFeatured,
        images:
          fullProduct.images?.map(
            (img: { url: string; alt: string | null }) => ({
              url: img.url,
              alt: img.alt ?? "",
            }),
          ) ?? [],
      });
    } catch {
      NotificationService.error("ไม่สามารถโหลดข้อมูลสินค้าได้");
      close();
      resetFormState();
    }
  };

  const handleDelete = (product: Product) => {
    modals.openConfirmModal({
      title: (
        <Group gap="xs">
          <ThemeIcon color="red" variant="light" size="sm" radius="xl">
            <IconTrash size={14} />
          </ThemeIcon>
          <Text fw={600}>ยืนยันการลบสินค้า</Text>
        </Group>
      ),
      children: (
        <Text size="sm">
          คุณต้องการลบสินค้า &quot;<b>{product.name}</b>&quot; ใช่หรือไม่?
          การดำเนินการนี้ไม่สามารถย้อนกลับได้
        </Text>
      ),
      labels: { confirm: "ลบสินค้า", cancel: "ยกเลิก" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        const loadingId = NotificationService.loading("กำลังลบสินค้า...");
        try {
          const res = await fetch(`/api/admin/products/${product.id}`, {
            method: "DELETE",
          });
          if (!res.ok) throw new Error();
          NotificationService.updateToSuccess(loadingId, {
            message: "ลบสินค้าสำเร็จ",
          });
          fetchProducts(pagination.page);
        } catch {
          NotificationService.updateToError(loadingId, {
            message: "ไม่สามารถลบสินค้าได้",
          });
        }
      },
    });
  };

  const handleAdd = () => {
    resetFormState();
    open();
  };

  const categoryOptions = categories.map((c) => ({
    value: c.id,
    label: `${c.name} (${c._count.products})`,
  }));

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-end">
        <div>
          <Text size="sm" c="dimmed">
            รายการทั้งหมด {pagination.total} รายการ
          </Text>
          <Title order={2}>จัดการสินค้า</Title>
        </div>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={handleAdd}
          radius="md"
        >
          เพิ่มสินค้า
        </Button>
      </Group>

      <Paper withBorder p="lg" radius="md" shadow="xs">
        <Group mb="lg" gap="sm">
          <TextInput
            placeholder="ค้นหาชื่อสินค้า..."
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            style={{ flex: 1 }}
            radius="md"
          />
          <Select
            placeholder="ทุกหมวดหมู่"
            data={categoryOptions}
            value={filterCategory}
            onChange={setFilterCategory}
            clearable
            leftSection={<IconFilter size={16} />}
            w={220}
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
          records={products}
          idAccessor="id"
          shadow="none"
          rowStyle={(product) =>
            !product.isActive ? { opacity: 0.55 } : undefined
          }
          columns={[
            {
              accessor: "name",
              title: "สินค้า",
              width: "35%",
              render: (product) => (
                <Group gap="sm">
                  <Box
                    w={48}
                    h={48}
                    style={{
                      borderRadius: "var(--mantine-radius-md)",
                      overflow: "hidden",
                      border: "1px solid var(--mantine-color-gray-2)",
                      flexShrink: 0,
                    }}
                  >
                    {product.images?.[0] ? (
                      <Image
                        src={product.images[0].url}
                        alt={product.name}
                        w={48}
                        h={48}
                        fit="cover"
                      />
                    ) : (
                      <Box
                        w={48}
                        h={48}
                        bg="gray.1"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <IconPackage
                          size={20}
                          color="var(--mantine-color-gray-4)"
                        />
                      </Box>
                    )}
                  </Box>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <Group gap={4}>
                      <Text size="sm" fw={600} lineClamp={1}>
                        {product.name}
                      </Text>
                      {product.isFeatured && (
                        <Tooltip label="สินค้าแนะนำ">
                          <IconStar
                            size={14}
                            fill="var(--mantine-color-yellow-5)"
                            color="var(--mantine-color-yellow-5)"
                          />
                        </Tooltip>
                      )}
                    </Group>
                    <Text size="xs" c="dimmed" lineClamp={1}>
                      {product.category?.name ?? "ไม่มีหมวดหมู่"}
                    </Text>
                  </div>
                </Group>
              ),
            },
            {
              accessor: "price",
              title: "ราคา",
              textAlign: "right",
              width: 120,
              render: (product) => (
                <Text size="sm" fw={600}>
                  ฿{Number(product.price).toLocaleString()}
                </Text>
              ),
            },
            {
              accessor: "stock",
              title: "คงเหลือ",
              textAlign: "center",
              width: 100,
              render: (product) => (
                <Badge
                  color={
                    product.stock === 0
                      ? "red"
                      : product.stock <= 5
                        ? "orange"
                        : "green"
                  }
                  variant="light"
                  radius="md"
                  size="md"
                >
                  {product.stock === 0 ? "หมด" : product.stock}
                </Badge>
              ),
            },
            {
              accessor: "_count.orderItems",
              title: "ยอดขาย",
              textAlign: "center",
              width: 80,
              render: (product) => (
                <Text size="sm" c="dimmed">
                  {product._count.orderItems}
                </Text>
              ),
            },
            {
              accessor: "isActive",
              title: "สถานะ",
              textAlign: "center",
              width: 100,
              render: (product) => (
                <Badge
                  color={product.isActive ? "green" : "gray"}
                  variant={product.isActive ? "light" : "outline"}
                  radius="md"
                  size="md"
                >
                  {product.isActive ? "เปิดขาย" : "ปิด"}
                </Badge>
              ),
            },
            {
              accessor: "actions",
              title: "",
              textAlign: "center",
              width: 90,
              render: (product) => (
                <Group gap={4} justify="center" wrap="nowrap">
                  <Tooltip label="แก้ไข">
                    <ActionIcon
                      variant="light"
                      color="blue"
                      size="md"
                      radius="md"
                      onClick={() => handleEdit(product)}
                    >
                      <IconEdit size={15} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="ลบ">
                    <ActionIcon
                      variant="light"
                      color="red"
                      size="md"
                      radius="md"
                      onClick={() => handleDelete(product)}
                    >
                      <IconTrash size={15} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              ),
            },
          ]}
          totalRecords={pagination.total}
          recordsPerPage={PAGE_SIZE}
          page={pagination.page}
          onPageChange={(p) => fetchProducts(p)}
          noRecordsText="ไม่พบสินค้า"
          paginationText={({ from, to, totalRecords }) =>
            `แสดง ${from}–${to} จาก ${totalRecords} รายการ`
          }
        />
      </Paper>

      <Modal
        opened={opened}
        onClose={() => {
          close();
          resetFormState();
        }}
        title={
          <Group gap="xs">
            <ThemeIcon
              color={editingId ? "blue" : "green"}
              variant="light"
              size="md"
              radius="xl"
            >
              {editingId ? <IconEdit size={16} /> : <IconPlus size={16} />}
            </ThemeIcon>
            <Text fw={600}>
              {editingId ? "แก้ไขสินค้า" : "เพิ่มสินค้าใหม่"}
            </Text>
          </Group>
        }
        size="lg"
        radius="lg"
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput
              label="ชื่อสินค้า"
              placeholder="ระบุชื่อสินค้า"
              withAsterisk
              radius="md"
              {...form.getInputProps("name")}
            />
            <Textarea
              label="รายละเอียด"
              placeholder="รายละเอียดสินค้า"
              minRows={3}
              autosize
              maxRows={6}
              radius="md"
              {...form.getInputProps("description")}
            />
            <SimpleGrid cols={2}>
              <NumberInput
                label="ราคา (บาท)"
                placeholder="0.00"
                min={0}
                decimalScale={2}
                withAsterisk
                radius="md"
                leftSection="฿"
                thousandSeparator=","
                {...form.getInputProps("price")}
              />
              <NumberInput
                label="จำนวนคงเหลือ"
                placeholder="0"
                min={0}
                radius="md"
                thousandSeparator=","
                {...form.getInputProps("stock")}
              />
            </SimpleGrid>
            <Select
              label="หมวดหมู่"
              placeholder="เลือกหมวดหมู่"
              data={categoryOptions}
              clearable
              radius="md"
              {...form.getInputProps("categoryId")}
            />
            <MultiImageUpload
              value={form.values.images}
              onChange={(images) => form.setFieldValue("images", images)}
              onRemoveUploaded={(url) => {
                deletedUrlsRef.current = [...deletedUrlsRef.current, url];
              }}
              maxFiles={5}
            />
            <Divider />
            <Group>
              <Switch
                label="เปิดขาย"
                color="green"
                {...form.getInputProps("isActive", { type: "checkbox" })}
              />
              <Switch
                label="สินค้าแนะนำ"
                color="yellow"
                {...form.getInputProps("isFeatured", { type: "checkbox" })}
              />
            </Group>
            <Group justify="flex-end" mt="sm">
              <Button
                variant="default"
                radius="md"
                onClick={() => {
                  close();
                  resetFormState();
                }}
              >
                ยกเลิก
              </Button>
              <Button type="submit" radius="md">
                {editingId ? "บันทึกการแก้ไข" : "สร้างสินค้า"}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}
