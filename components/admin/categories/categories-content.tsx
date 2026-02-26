"use client";

import { useEffect, useState, useCallback } from "react";
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
  Textarea,
  Switch,
  Modal,
  ThemeIcon,
  Image,
  Box,
  Tooltip,
  Divider,
  SimpleGrid,
  Card,
  Center,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconCategory,
  IconPackage,
} from "@tabler/icons-react";
import { NotificationService } from "@/utils/notificationService";

interface Category {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  slug: string;
  isActive: boolean;
  createdAt: string;
  _count: { products: number };
}

export function CategoriesContent() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [opened, { open, close }] = useDisclosure(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const form = useForm({
    initialValues: {
      name: "",
      description: "",
      image: "",
      isActive: true,
    },
    validate: {
      name: (v) => (v.trim() ? null : "กรุณาระบุชื่อหมวดหมู่"),
    },
  });

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/categories");
      const json = await res.json();
      setCategories(json);
    } catch {
      NotificationService.error("ไม่สามารถโหลดข้อมูลหมวดหมู่ได้");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleSubmit = async (values: typeof form.values) => {
    const loadingId = NotificationService.loading(
      editingId ? "กำลังแก้ไขหมวดหมู่..." : "กำลังสร้างหมวดหมู่...",
    );
    try {
      const url = editingId
        ? `/api/admin/categories/${editingId}`
        : "/api/admin/categories";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error();
      NotificationService.updateToSuccess(loadingId, {
        message: editingId ? "แก้ไขหมวดหมู่สำเร็จ" : "สร้างหมวดหมู่สำเร็จ",
      });
      close();
      form.reset();
      setEditingId(null);
      fetchCategories();
    } catch {
      NotificationService.updateToError(loadingId, {
        message: "เกิดข้อผิดพลาด กรุณาลองใหม่",
      });
    }
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    form.setValues({
      name: category.name,
      description: category.description ?? "",
      image: category.image ?? "",
      isActive: category.isActive,
    });
    open();
  };

  const handleDelete = (category: Category) => {
    modals.openConfirmModal({
      title: (
        <Group gap="xs">
          <ThemeIcon color="red" variant="light" size="sm" radius="xl">
            <IconTrash size={14} />
          </ThemeIcon>
          <Text fw={600}>ยืนยันการลบหมวดหมู่</Text>
        </Group>
      ),
      children: (
        <Stack gap="xs">
          <Text size="sm">
            คุณต้องการลบหมวดหมู่ &quot;<b>{category.name}</b>&quot; ใช่หรือไม่?
          </Text>
          {category._count.products > 0 && (
            <Badge color="red" variant="light" size="lg">
              มีสินค้า {category._count.products} รายการในหมวดหมู่นี้
            </Badge>
          )}
        </Stack>
      ),
      labels: { confirm: "ลบหมวดหมู่", cancel: "ยกเลิก" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        const loadingId = NotificationService.loading("กำลังลบหมวดหมู่...");
        try {
          const res = await fetch(`/api/admin/categories/${category.id}`, {
            method: "DELETE",
          });
          if (!res.ok) throw new Error();
          NotificationService.updateToSuccess(loadingId, {
            message: "ลบหมวดหมู่สำเร็จ",
          });
          fetchCategories();
        } catch {
          NotificationService.updateToError(loadingId, {
            message: "ไม่สามารถลบหมวดหมู่ได้",
          });
        }
      },
    });
  };

  const handleAdd = () => {
    setEditingId(null);
    form.reset();
    open();
  };

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-end">
        <div>
          <Text size="sm" c="dimmed">
            ทั้งหมด {categories.length} หมวดหมู่
          </Text>
          <Title order={2}>จัดการหมวดหมู่</Title>
        </div>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={handleAdd}
          radius="md"
        >
          เพิ่มหมวดหมู่
        </Button>
      </Group>

      <SimpleGrid cols={{ base: 1, xs: 2, md: 3, lg: 4 }}>
        {categories.map((cat) => (
          <Card
            key={cat.id}
            withBorder
            radius="md"
            shadow="xs"
            padding={0}
            style={{
              opacity: cat.isActive ? 1 : 0.6,
              transition: "transform 100ms ease, box-shadow 100ms ease",
            }}
          >
            <Card.Section h={120} bg="gray.1">
              {cat.image ? (
                <Image
                  src={cat.image}
                  alt={cat.name}
                  h={120}
                  fit="cover"
                  fallbackSrc="https://placehold.co/400x120?text=No+Image"
                />
              ) : (
                <Center h={120}>
                  <ThemeIcon
                    variant="light"
                    color="grape"
                    size={48}
                    radius="xl"
                  >
                    <IconCategory size={24} />
                  </ThemeIcon>
                </Center>
              )}
            </Card.Section>
            <Stack p="sm" gap={6}>
              <Group justify="space-between" align="flex-start">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text fw={600} size="sm" lineClamp={1}>
                    {cat.name}
                  </Text>
                  <Text size="xs" c="dimmed" lineClamp={1}>
                    {cat.description ?? "ไม่มีรายละเอียด"}
                  </Text>
                </div>
                <Badge
                  color={cat.isActive ? "green" : "gray"}
                  variant="light"
                  size="xs"
                >
                  {cat.isActive ? "เปิด" : "ปิด"}
                </Badge>
              </Group>

              <Divider />

              <Group justify="space-between">
                <Group gap={4}>
                  <IconPackage size={14} color="var(--mantine-color-blue-5)" />
                  <Text size="xs" c="blue" fw={600}>
                    {cat._count.products} สินค้า
                  </Text>
                </Group>
                <Group gap={4}>
                  <Tooltip label="แก้ไข">
                    <ActionIcon
                      variant="light"
                      color="blue"
                      size="sm"
                      radius="md"
                      onClick={() => handleEdit(cat)}
                    >
                      <IconEdit size={14} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="ลบ">
                    <ActionIcon
                      variant="light"
                      color="red"
                      size="sm"
                      radius="md"
                      onClick={() => handleDelete(cat)}
                    >
                      <IconTrash size={14} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Group>
            </Stack>
          </Card>
        ))}
      </SimpleGrid>

      {!loading && categories.length === 0 && (
        <Paper withBorder p="xl" radius="md" ta="center">
          <Stack align="center" gap="xs">
            <ThemeIcon color="gray" variant="light" size="xl" radius="xl">
              <IconCategory size={24} />
            </ThemeIcon>
            <Text c="dimmed">ยังไม่มีหมวดหมู่</Text>
          </Stack>
        </Paper>
      )}

      <Modal
        opened={opened}
        onClose={() => {
          close();
          setEditingId(null);
          form.reset();
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
              {editingId ? "แก้ไขหมวดหมู่" : "เพิ่มหมวดหมู่ใหม่"}
            </Text>
          </Group>
        }
        radius="lg"
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput
              label="ชื่อหมวดหมู่"
              placeholder="ระบุชื่อหมวดหมู่"
              withAsterisk
              radius="md"
              {...form.getInputProps("name")}
            />
            <Textarea
              label="รายละเอียด"
              placeholder="รายละเอียดหมวดหมู่"
              minRows={2}
              autosize
              maxRows={4}
              radius="md"
              {...form.getInputProps("description")}
            />
            <TextInput
              label="URL รูปภาพ"
              placeholder="https://example.com/image.jpg"
              radius="md"
              {...form.getInputProps("image")}
            />
            {form.values.image && (
              <Image
                src={form.values.image}
                alt="preview"
                h={100}
                fit="contain"
                radius="md"
                fallbackSrc="https://placehold.co/400x100?text=Preview"
              />
            )}
            <Divider />
            <Switch
              label="เปิดใช้งาน"
              color="green"
              {...form.getInputProps("isActive", { type: "checkbox" })}
            />
            <Group justify="flex-end" mt="sm">
              <Button
                variant="default"
                radius="md"
                onClick={() => {
                  close();
                  setEditingId(null);
                  form.reset();
                }}
              >
                ยกเลิก
              </Button>
              <Button type="submit" radius="md">
                {editingId ? "บันทึกการแก้ไข" : "สร้างหมวดหมู่"}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}
