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
  NumberInput,
  Switch,
  Modal,
  Image,
  SimpleGrid,
  Card,
  ThemeIcon,
  Tooltip,
  Divider,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconPhoto,
  IconExternalLink,
  IconArrowsSort,
} from "@tabler/icons-react";
import { NotificationService } from "@/utils/notificationService";
import {
  ImageUpload,
  uploadImageFile,
  deleteImageFile,
} from "@/components/admin/image-upload";

interface Banner {
  id: string;
  title: string | null;
  image: string;
  link: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function BannersContent() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [opened, { open, close }] = useDisclosure(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const stagedFileRef = useRef<File | null>(null);
  const deletedUrlRef = useRef<string | null>(null);

  const form = useForm({
    initialValues: {
      title: "",
      image: "",
      link: "",
      sortOrder: 0,
      isActive: true,
    },
    validate: {
      image: (v) => (v.trim() ? null : "กรุณาอัพโหลดรูปภาพ"),
    },
  });

  const fetchBanners = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/banners");
      const json = await res.json();
      setBanners(json);
    } catch {
      NotificationService.error("ไม่สามารถโหลดข้อมูลแบนเนอร์ได้");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const resetFormState = () => {
    form.reset();
    setEditingId(null);
    stagedFileRef.current = null;
    deletedUrlRef.current = null;
  };

  const handleSubmit = async (values: typeof form.values) => {
    const loadingId = NotificationService.loading(
      editingId ? "กำลังแก้ไขแบนเนอร์..." : "กำลังสร้างแบนเนอร์...",
    );
    try {
      let imageUrl = values.image;

      if (stagedFileRef.current) {
        imageUrl = await uploadImageFile(stagedFileRef.current, "banner");
      }

      if (deletedUrlRef.current) {
        await deleteImageFile(deletedUrlRef.current);
      }

      const url = editingId
        ? `/api/admin/banners/${editingId}`
        : "/api/admin/banners";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, image: imageUrl }),
      });
      if (!res.ok) throw new Error();
      NotificationService.updateToSuccess(loadingId, {
        message: editingId ? "แก้ไขแบนเนอร์สำเร็จ" : "สร้างแบนเนอร์สำเร็จ",
      });
      close();
      resetFormState();
      fetchBanners();
    } catch {
      NotificationService.updateToError(loadingId, {
        message: "เกิดข้อผิดพลาด กรุณาลองใหม่",
      });
    }
  };

  const handleEdit = (banner: Banner) => {
    resetFormState();
    setEditingId(banner.id);
    form.setValues({
      title: banner.title ?? "",
      image: banner.image,
      link: banner.link ?? "",
      sortOrder: banner.sortOrder,
      isActive: banner.isActive,
    });
    open();
  };

  const handleDelete = (banner: Banner) => {
    modals.openConfirmModal({
      title: (
        <Group gap="xs">
          <ThemeIcon color="red" variant="light" size="sm" radius="xl">
            <IconTrash size={14} />
          </ThemeIcon>
          <Text fw={600}>ยืนยันการลบแบนเนอร์</Text>
        </Group>
      ),
      children: (
        <Stack gap="sm">
          <Text size="sm">
            คุณต้องการลบแบนเนอร์ &quot;
            <b>{banner.title ?? "ไม่มีชื่อ"}</b>&quot; ใช่หรือไม่?
          </Text>
          {banner.image && (
            <Image
              src={banner.image}
              alt="preview"
              h={80}
              fit="cover"
              radius="md"
            />
          )}
        </Stack>
      ),
      labels: { confirm: "ลบแบนเนอร์", cancel: "ยกเลิก" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        const loadingId = NotificationService.loading("กำลังลบแบนเนอร์...");
        try {
          const res = await fetch(`/api/admin/banners/${banner.id}`, {
            method: "DELETE",
          });
          if (!res.ok) throw new Error();
          NotificationService.updateToSuccess(loadingId, {
            message: "ลบแบนเนอร์สำเร็จ",
          });
          fetchBanners();
        } catch {
          NotificationService.updateToError(loadingId, {
            message: "ไม่สามารถลบแบนเนอร์ได้",
          });
        }
      },
    });
  };

  const handleAdd = () => {
    resetFormState();
    open();
  };

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-end">
        <div>
          <Text size="sm" c="dimmed">
            ทั้งหมด {banners.length} แบนเนอร์
          </Text>
          <Title order={2}>จัดการแบนเนอร์</Title>
        </div>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={handleAdd}
          radius="md"
        >
          เพิ่มแบนเนอร์
        </Button>
      </Group>

      <SimpleGrid cols={{ base: 1, md: 2 }}>
        {banners.map((banner) => (
          <Card
            key={banner.id}
            withBorder
            radius="md"
            shadow="xs"
            padding={0}
            style={{
              opacity: banner.isActive ? 1 : 0.6,
              transition: "transform 100ms ease, box-shadow 100ms ease",
            }}
          >
            <Card.Section pos="relative">
              <Image
                src={banner.image}
                alt={banner.title ?? "banner"}
                h={200}
                fit="cover"
                fallbackSrc="https://placehold.co/800x200?text=No+Image"
              />
              <Group pos="absolute" top={8} left={8} gap={6}>
                <Badge
                  color={banner.isActive ? "green" : "gray"}
                  variant="filled"
                  size="sm"
                  style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }}
                >
                  {banner.isActive ? "แสดงอยู่" : "ซ่อน"}
                </Badge>
                <Badge
                  color="dark"
                  variant="filled"
                  size="sm"
                  leftSection={<IconArrowsSort size={10} />}
                  style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }}
                >
                  {banner.sortOrder}
                </Badge>
              </Group>
              <Group pos="absolute" top={8} right={8} gap={4}>
                <Tooltip label="แก้ไข">
                  <ActionIcon
                    variant="filled"
                    color="blue"
                    size="md"
                    radius="xl"
                    onClick={() => handleEdit(banner)}
                    style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }}
                  >
                    <IconEdit size={14} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="ลบ">
                  <ActionIcon
                    variant="filled"
                    color="red"
                    size="md"
                    radius="xl"
                    onClick={() => handleDelete(banner)}
                    style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }}
                  >
                    <IconTrash size={14} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Card.Section>

            <Stack p="sm" gap={4}>
              <Group justify="space-between" align="flex-start">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text fw={600} size="sm" lineClamp={1}>
                    {banner.title ?? "ไม่มีชื่อ"}
                  </Text>
                  {banner.link ? (
                    <Group gap={4}>
                      <IconExternalLink
                        size={12}
                        color="var(--mantine-color-blue-5)"
                      />
                      <Text size="xs" c="blue" lineClamp={1}>
                        {banner.link}
                      </Text>
                    </Group>
                  ) : (
                    <Text size="xs" c="dimmed">
                      ไม่มีลิงก์
                    </Text>
                  )}
                </div>
                <Text size="xs" c="dimmed">
                  {new Date(banner.updatedAt).toLocaleDateString("th-TH", {
                    day: "numeric",
                    month: "short",
                  })}
                </Text>
              </Group>
            </Stack>
          </Card>
        ))}
      </SimpleGrid>

      {!loading && banners.length === 0 && (
        <Paper withBorder p="xl" radius="md" ta="center">
          <Stack align="center" gap="xs">
            <ThemeIcon color="gray" variant="light" size="xl" radius="xl">
              <IconPhoto size={24} />
            </ThemeIcon>
            <Text c="dimmed">ยังไม่มีแบนเนอร์</Text>
            <Button
              variant="light"
              size="sm"
              leftSection={<IconPlus size={14} />}
              onClick={handleAdd}
            >
              เพิ่มแบนเนอร์แรก
            </Button>
          </Stack>
        </Paper>
      )}

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
              {editingId ? "แก้ไขแบนเนอร์" : "เพิ่มแบนเนอร์ใหม่"}
            </Text>
          </Group>
        }
        radius="lg"
        size="md"
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput
              label="ชื่อแบนเนอร์"
              placeholder="ระบุชื่อ (ไม่บังคับ)"
              radius="md"
              {...form.getInputProps("title")}
            />
            <ImageUpload
              label="รูปภาพแบนเนอร์"
              required
              value={form.values.image}
              onChange={(url) => form.setFieldValue("image", url)}
              onFileChange={(file) => {
                stagedFileRef.current = file;
              }}
              onRemoveUploaded={(url) => {
                deletedUrlRef.current = url;
              }}
              error={form.errors.image as string}
              height={160}
            />
            <TextInput
              label="ลิงก์ปลายทาง"
              placeholder="https://example.com"
              radius="md"
              leftSection={<IconExternalLink size={14} />}
              {...form.getInputProps("link")}
            />
            <NumberInput
              label="ลำดับการแสดง"
              placeholder="0"
              min={0}
              radius="md"
              leftSection={<IconArrowsSort size={14} />}
              {...form.getInputProps("sortOrder")}
            />
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
                  resetFormState();
                }}
              >
                ยกเลิก
              </Button>
              <Button type="submit" radius="md">
                {editingId ? "บันทึกการแก้ไข" : "สร้างแบนเนอร์"}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}
