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
  Select,
  Modal,
  Avatar,
  ThemeIcon,
  Tooltip,
  Divider,
  Textarea,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { DataTable } from "mantine-datatable";
import {
  IconSearch,
  IconEdit,
  IconTrash,
  IconFilter,
  IconShieldCheck,
  IconUser,
  IconShoppingCart,
  IconStar,
} from "@tabler/icons-react";
import { useSession } from "next-auth/react";
import { NotificationService } from "@/utils/notificationService";

interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  phone: string | null;
  role: "USER" | "ADMIN";
  createdAt: string;
  _count: { orders: number; reviews: number };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const PAGE_SIZE = 10;

export function UsersContent() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<string | null>(null);
  const [opened, { open, close }] = useDisclosure(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const form = useForm({
    initialValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      role: "USER" as "USER" | "ADMIN",
    },
  });

  const fetchUsers = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(PAGE_SIZE),
        });
        if (search) params.set("search", search);
        if (filterRole) params.set("role", filterRole);

        const res = await fetch(`/api/admin/users?${params}`);
        const json = await res.json();
        setUsers(json.data);
        setPagination(json.pagination);
      } catch {
        NotificationService.error("ไม่สามารถโหลดข้อมูลผู้ใช้ได้");
      } finally {
        setLoading(false);
      }
    },
    [search, filterRole],
  );

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleEdit = async (user: User) => {
    setEditingId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`);
      const detail = await res.json();
      form.setValues({
        name: detail.name ?? "",
        email: detail.email ?? "",
        phone: detail.phone ?? "",
        address: detail.address ?? "",
        role: detail.role,
      });
      open();
    } catch {
      NotificationService.error("ไม่สามารถโหลดข้อมูลผู้ใช้ได้");
    }
  };

  const handleSubmit = async (values: typeof form.values) => {
    if (!editingId) return;
    const loadingId = NotificationService.loading("กำลังบันทึก...");
    try {
      const res = await fetch(`/api/admin/users/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error();
      NotificationService.updateToSuccess(loadingId, {
        message: "แก้ไขข้อมูลผู้ใช้สำเร็จ",
      });
      close();
      form.reset();
      setEditingId(null);
      fetchUsers(pagination.page);
    } catch {
      NotificationService.updateToError(loadingId, {
        message: "เกิดข้อผิดพลาด กรุณาลองใหม่",
      });
    }
  };

  const handleDelete = (user: User) => {
    modals.openConfirmModal({
      title: (
        <Group gap="xs">
          <ThemeIcon color="red" variant="light" size="sm" radius="xl">
            <IconTrash size={14} />
          </ThemeIcon>
          <Text fw={600}>ยืนยันการลบผู้ใช้</Text>
        </Group>
      ),
      children: (
        <Text size="sm">
          คุณต้องการลบผู้ใช้ &quot;<b>{user.name ?? user.email}</b>&quot;
          ใช่หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้
        </Text>
      ),
      labels: { confirm: "ลบผู้ใช้", cancel: "ยกเลิก" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        const loadingId = NotificationService.loading("กำลังลบผู้ใช้...");
        try {
          const res = await fetch(`/api/admin/users/${user.id}`, {
            method: "DELETE",
          });
          if (!res.ok) {
            const err = await res.json().catch(() => null);
            throw new Error(err?.error || "ไม่สามารถลบผู้ใช้ได้");
          }
          NotificationService.updateToSuccess(loadingId, {
            message: "ลบผู้ใช้สำเร็จ",
          });
          fetchUsers(pagination.page);
        } catch (err) {
          NotificationService.updateToError(loadingId, {
            message:
              err instanceof Error ? err.message : "ไม่สามารถลบผู้ใช้ได้",
          });
        }
      },
    });
  };

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-end">
        <div>
          <Text size="sm" c="dimmed">
            สมาชิกทั้งหมด {pagination.total} คน
          </Text>
          <Title order={2}>จัดการผู้ใช้งาน</Title>
        </div>
      </Group>

      <Paper withBorder p="lg" radius="md" shadow="xs">
        <Group mb="lg" gap="sm">
          <TextInput
            placeholder="ค้นหาชื่อ, อีเมล..."
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            style={{ flex: 1 }}
            radius="md"
          />
          <Select
            placeholder="ทุกบทบาท"
            data={[
              { value: "USER", label: "ผู้ใช้ทั่วไป" },
              { value: "ADMIN", label: "แอดมิน" },
            ]}
            value={filterRole}
            onChange={setFilterRole}
            clearable
            leftSection={<IconFilter size={16} />}
            w={180}
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
          records={users}
          idAccessor="id"
          shadow="none"
          columns={[
            {
              accessor: "name",
              title: "ผู้ใช้",
              width: "30%",
              render: (user) => (
                <Group gap="sm">
                  <Avatar
                    src={user.image}
                    radius="xl"
                    size="md"
                    color={user.role === "ADMIN" ? "red" : "green"}
                  >
                    {(user.name ?? user.email ?? "?")[0]?.toUpperCase()}
                  </Avatar>
                  <div>
                    <Group gap={4}>
                      <Text size="sm" fw={600}>
                        {user.name ?? "-"}
                      </Text>
                      {user.role === "ADMIN" && (
                        <Tooltip label="แอดมิน">
                          <IconShieldCheck
                            size={14}
                            color="var(--mantine-color-red-5)"
                          />
                        </Tooltip>
                      )}
                    </Group>
                    <Text size="xs" c="dimmed">
                      {user.email}
                    </Text>
                  </div>
                </Group>
              ),
            },
            {
              accessor: "phone",
              title: "โทรศัพท์",
              width: 140,
              render: (user) => (
                <Text size="sm" c={user.phone ? undefined : "dimmed"}>
                  {user.phone ?? "-"}
                </Text>
              ),
            },
            {
              accessor: "role",
              title: "บทบาท",
              textAlign: "center",
              width: 110,
              render: (user) => (
                <Badge
                  color={user.role === "ADMIN" ? "red" : "blue"}
                  variant="light"
                  radius="md"
                  size="md"
                  leftSection={
                    user.role === "ADMIN" ? (
                      <IconShieldCheck size={12} />
                    ) : (
                      <IconUser size={12} />
                    )
                  }
                >
                  {user.role === "ADMIN" ? "แอดมิน" : "ผู้ใช้"}
                </Badge>
              ),
            },
            {
              accessor: "_count.orders",
              title: "ออเดอร์",
              textAlign: "center",
              width: 80,
              render: (user) => (
                <Group gap={4} justify="center">
                  <IconShoppingCart
                    size={14}
                    color="var(--mantine-color-gray-5)"
                  />
                  <Text size="sm" fw={500}>
                    {user._count.orders}
                  </Text>
                </Group>
              ),
            },
            {
              accessor: "_count.reviews",
              title: "รีวิว",
              textAlign: "center",
              width: 70,
              render: (user) => (
                <Group gap={4} justify="center">
                  <IconStar size={14} color="var(--mantine-color-yellow-5)" />
                  <Text size="sm">{user._count.reviews}</Text>
                </Group>
              ),
            },
            {
              accessor: "createdAt",
              title: "สมัครเมื่อ",
              width: 120,
              render: (user) => (
                <Text size="xs" c="dimmed">
                  {new Date(user.createdAt).toLocaleDateString("th-TH", {
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
              render: (user) => (
                <Group gap={4} justify="center" wrap="nowrap">
                  <Tooltip label="แก้ไข">
                    <ActionIcon
                      variant="light"
                      color="blue"
                      size="md"
                      radius="md"
                      onClick={() => handleEdit(user)}
                    >
                      <IconEdit size={15} />
                    </ActionIcon>
                  </Tooltip>
                  {session?.user?.id !== user.id && (
                    <Tooltip label="ลบ">
                      <ActionIcon
                        variant="light"
                        color="red"
                        size="md"
                        radius="md"
                        onClick={() => handleDelete(user)}
                      >
                        <IconTrash size={15} />
                      </ActionIcon>
                    </Tooltip>
                  )}
                </Group>
              ),
            },
          ]}
          totalRecords={pagination.total}
          recordsPerPage={PAGE_SIZE}
          page={pagination.page}
          onPageChange={(p) => fetchUsers(p)}
          noRecordsText="ไม่พบผู้ใช้งาน"
          paginationText={({ from, to, totalRecords }) =>
            `แสดง ${from}–${to} จาก ${totalRecords} คน`
          }
        />
      </Paper>

      <Modal
        opened={opened}
        onClose={() => {
          close();
          setEditingId(null);
          form.reset();
        }}
        title={
          <Group gap="xs">
            <ThemeIcon color="blue" variant="light" size="md" radius="xl">
              <IconEdit size={16} />
            </ThemeIcon>
            <Text fw={600}>แก้ไขข้อมูลผู้ใช้</Text>
          </Group>
        }
        radius="lg"
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput
              label="ชื่อ"
              placeholder="ชื่อผู้ใช้"
              radius="md"
              {...form.getInputProps("name")}
            />
            <TextInput
              label="อีเมล"
              placeholder="อีเมล"
              radius="md"
              {...form.getInputProps("email")}
            />
            <TextInput
              label="โทรศัพท์"
              placeholder="เบอร์โทรศัพท์"
              radius="md"
              {...form.getInputProps("phone")}
            />
            <Textarea
              label="ที่อยู่"
              placeholder="ที่อยู่"
              minRows={2}
              autosize
              maxRows={4}
              radius="md"
              {...form.getInputProps("address")}
            />
            <Divider />
            <Select
              label="บทบาท"
              data={[
                { value: "USER", label: "ผู้ใช้ทั่วไป" },
                { value: "ADMIN", label: "แอดมิน" },
              ]}
              radius="md"
              {...form.getInputProps("role")}
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
                บันทึกการแก้ไข
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}
