"use client";

import {
  useEffect,
  useState,
  useCallback,
  useRef,
  startTransition,
} from "react";
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
  Image,
  ThemeIcon,
  Box,
  Tooltip,
  Divider,
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
  IconCalendarEvent,
  IconPhoto,
} from "@tabler/icons-react";
import { NotificationService } from "@/utils/notificationService";
import {
  ImageUpload,
  MultiImageUpload,
  uploadImageFile,
  deleteImageFile,
} from "@/components/admin/image-upload";
import type { StagedImage } from "@/components/admin/image-upload";

interface ActivityImage {
  id: string;
  url: string;
  caption: string | null;
}

interface Activity {
  id: string;
  title: string;
  content: string;
  coverImage: string | null;
  slug: string;
  isPublished: boolean;
  publishedAt: string | null;
  images: ActivityImage[];
  _count: { images: number };
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const PAGE_SIZE = 10;

export function ActivitiesContent() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [opened, { open, close }] = useDisclosure(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const coverFileRef = useRef<File | null>(null);
  const deletedCoverRef = useRef<string | null>(null);
  const deletedGalleryUrlsRef = useRef<string[]>([]);

  const form = useForm({
    initialValues: {
      title: "",
      content: "",
      coverImage: "",
      isPublished: false,
      images: [] as StagedImage[],
    },
    validate: {
      title: (v) => (v.trim() ? null : "กรุณาระบุชื่อกิจกรรม"),
      content: (v) => (v.trim() ? null : "กรุณาระบุเนื้อหา"),
    },
  });

  const fetchActivities = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(PAGE_SIZE),
        });
        if (search) params.set("search", search);

        const res = await fetch(`/api/admin/activities?${params}`);
        const json = await res.json();
        setActivities(json.data);
        setPagination(json.pagination);
      } catch {
        NotificationService.error("ไม่สามารถโหลดข้อมูลกิจกรรมได้");
      } finally {
        setLoading(false);
      }
    },
    [search],
  );

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const resetFormState = () => {
    form.reset();
    setEditingId(null);
    coverFileRef.current = null;
    deletedCoverRef.current = null;
    deletedGalleryUrlsRef.current = [];
  };

  const handleSubmit = async (values: typeof form.values) => {
    const loadingId = NotificationService.loading(
      editingId ? "กำลังแก้ไขกิจกรรม..." : "กำลังสร้างกิจกรรม...",
    );
    try {
      let coverUrl = values.coverImage;

      if (coverFileRef.current) {
        coverUrl = await uploadImageFile(coverFileRef.current, "activity");
      }

      if (deletedCoverRef.current) {
        await deleteImageFile(deletedCoverRef.current);
      }

      const uploadedImages = await Promise.all(
        values.images.map(async (img) => {
          if (img.file) {
            const url = await uploadImageFile(img.file, "activity");
            return { url, caption: img.alt ?? "" };
          }
          return { url: img.url, caption: img.alt ?? "" };
        }),
      );

      await Promise.all(
        deletedGalleryUrlsRef.current.map((u) => deleteImageFile(u)),
      );

      const url = editingId
        ? `/api/admin/activities/${editingId}`
        : "/api/admin/activities";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          coverImage: coverUrl,
          images: uploadedImages,
        }),
      });
      if (!res.ok) throw new Error();

      NotificationService.updateToSuccess(loadingId, {
        message: editingId ? "แก้ไขกิจกรรมสำเร็จ" : "สร้างกิจกรรมสำเร็จ",
      });
      close();
      resetFormState();
      fetchActivities(pagination.page);
    } catch {
      NotificationService.updateToError(loadingId, {
        message: "เกิดข้อผิดพลาด กรุณาลองใหม่",
      });
    }
  };

  const handleEdit = (activity: Activity) => {
    resetFormState();
    setEditingId(activity.id);
    open();

    // Defer heavy form population to next frame so the modal opens smoothly
    requestAnimationFrame(() => {
      startTransition(() => {
        form.setValues({
          title: activity.title,
          content: activity.content,
          coverImage: activity.coverImage ?? "",
          isPublished: activity.isPublished,
          images:
            activity.images?.map((img) => ({
              url: img.url,
              alt: img.caption ?? "",
            })) ?? [],
        });
      });
    });
  };

  const handleDelete = (activity: Activity) => {
    modals.openConfirmModal({
      title: (
        <Group gap="xs">
          <ThemeIcon color="red" variant="light" size="sm" radius="xl">
            <IconTrash size={14} />
          </ThemeIcon>
          <Text fw={600}>ยืนยันการลบกิจกรรม</Text>
        </Group>
      ),
      children: (
        <Stack gap="sm">
          <Text size="sm">
            คุณต้องการลบกิจกรรม &quot;<b>{activity.title}</b>&quot; ใช่หรือไม่?
            การดำเนินการนี้ไม่สามารถย้อนกลับได้
          </Text>
          {activity.coverImage && (
            <Image
              src={activity.coverImage}
              alt="preview"
              h={80}
              fit="cover"
              radius="md"
            />
          )}
        </Stack>
      ),
      labels: { confirm: "ลบกิจกรรม", cancel: "ยกเลิก" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        const loadingId = NotificationService.loading("กำลังลบกิจกรรม...");
        try {
          const res = await fetch(`/api/admin/activities/${activity.id}`, {
            method: "DELETE",
          });
          if (!res.ok) throw new Error();
          NotificationService.updateToSuccess(loadingId, {
            message: "ลบกิจกรรมสำเร็จ",
          });
          fetchActivities(pagination.page);
        } catch {
          NotificationService.updateToError(loadingId, {
            message: "ไม่สามารถลบกิจกรรมได้",
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
            รายการทั้งหมด {pagination.total} รายการ
          </Text>
          <Title order={2}>จัดการกิจกรรม</Title>
        </div>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={handleAdd}
          radius="md"
        >
          เพิ่มกิจกรรม
        </Button>
      </Group>

      <Paper withBorder p="lg" radius="md" shadow="xs">
        <Group mb="lg" gap="sm">
          <TextInput
            placeholder="ค้นหาชื่อกิจกรรม..."
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            style={{ flex: 1 }}
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
          records={activities}
          idAccessor="id"
          shadow="none"
          rowStyle={(activity) =>
            !activity.isPublished ? { opacity: 0.55 } : undefined
          }
          columns={[
            {
              accessor: "title",
              title: "กิจกรรม",
              width: "40%",
              render: (activity) => (
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
                    {activity.coverImage ? (
                      <Image
                        src={activity.coverImage}
                        alt={activity.title}
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
                        <IconCalendarEvent
                          size={20}
                          color="var(--mantine-color-gray-4)"
                        />
                      </Box>
                    )}
                  </Box>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <Text size="sm" fw={600} lineClamp={1}>
                      {activity.title}
                    </Text>
                    <Text size="xs" c="dimmed" lineClamp={1}>
                      {activity.content.replace(/<[^>]*>/g, "").slice(0, 80)}
                    </Text>
                  </div>
                </Group>
              ),
            },
            {
              accessor: "_count.images",
              title: "รูปภาพ",
              textAlign: "center",
              width: 80,
              render: (activity) => (
                <Group gap={4} justify="center">
                  <IconPhoto size={14} color="var(--mantine-color-gray-5)" />
                  <Text size="sm" c="dimmed">
                    {activity._count.images}
                  </Text>
                </Group>
              ),
            },
            {
              accessor: "isPublished",
              title: "สถานะ",
              textAlign: "center",
              width: 110,
              render: (activity) => (
                <Badge
                  color={activity.isPublished ? "green" : "gray"}
                  variant={activity.isPublished ? "light" : "outline"}
                  radius="md"
                  size="md"
                >
                  {activity.isPublished ? "เผยแพร่" : "ฉบับร่าง"}
                </Badge>
              ),
            },
            {
              accessor: "createdAt",
              title: "วันที่สร้าง",
              textAlign: "center",
              width: 120,
              render: (activity) => (
                <Text size="xs" c="dimmed">
                  {new Date(activity.createdAt).toLocaleDateString("th-TH", {
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
              width: 90,
              render: (activity) => (
                <Group gap={4} justify="center" wrap="nowrap">
                  <Tooltip label="แก้ไข">
                    <ActionIcon
                      variant="light"
                      color="blue"
                      size="md"
                      radius="md"
                      onClick={() => handleEdit(activity)}
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
                      onClick={() => handleDelete(activity)}
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
          onPageChange={(p) => fetchActivities(p)}
          noRecordsText="ไม่พบกิจกรรม"
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
              {editingId ? "แก้ไขกิจกรรม" : "เพิ่มกิจกรรมใหม่"}
            </Text>
          </Group>
        }
        size="lg"
        radius="lg"
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput
              label="ชื่อกิจกรรม"
              placeholder="ระบุชื่อกิจกรรม"
              withAsterisk
              radius="md"
              {...form.getInputProps("title")}
            />
            <Textarea
              label="เนื้อหา"
              placeholder="รายละเอียดกิจกรรม"
              withAsterisk
              minRows={4}
              autosize
              maxRows={10}
              radius="md"
              {...form.getInputProps("content")}
            />
            <ImageUpload
              label="รูปปก"
              value={form.values.coverImage}
              onChange={(url) => form.setFieldValue("coverImage", url)}
              onFileChange={(file) => {
                coverFileRef.current = file;
              }}
              onRemoveUploaded={(url) => {
                deletedCoverRef.current = url;
              }}
              height={180}
            />
            <MultiImageUpload
              label="แกลเลอรี่รูปภาพ"
              value={form.values.images}
              onChange={(images) => form.setFieldValue("images", images)}
              onRemoveUploaded={(url) => {
                deletedGalleryUrlsRef.current = [
                  ...deletedGalleryUrlsRef.current,
                  url,
                ];
              }}
              maxFiles={10}
            />
            <Divider />
            <Switch
              label="เผยแพร่"
              description="เปิดเผยแพร่กิจกรรมให้ผู้เข้าชมเห็น"
              color="green"
              {...form.getInputProps("isPublished", { type: "checkbox" })}
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
                {editingId ? "บันทึกการแก้ไข" : "สร้างกิจกรรม"}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}
