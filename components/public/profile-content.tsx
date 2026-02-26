"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Container,
  Title,
  Text,
  Stack,
  Group,
  Avatar,
  Paper,
  TextInput,
  Textarea,
  Button,
  Loader,
  Divider,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconUser,
  IconMail,
  IconPhone,
  IconMapPin,
  IconCheck,
  IconDeviceFloppy,
} from "@tabler/icons-react";

interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  phone: string | null;
  address: string | null;
  createdAt: string;
}

export function ProfileContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const lastSaveRef = useRef<number>(0);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin?callbackUrl=/profile");
      return;
    }
    if (status === "authenticated") {
      fetchProfile();
    }
  }, [status, router]);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/user/profile");
      const data = await res.json();
      setProfile(data);
      setName(data.name ?? "");
      setPhone(data.phone ?? "");
      setAddress(data.address ?? "");
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const now = Date.now();
    if (now - lastSaveRef.current < 2000) {
      notifications.show({
        title: "กรุณารอสักครู่",
        message: "คุณเพิ่งบันทึกข้อมูลไปแล้ว กรุณารอสักครู่",
        color: "yellow",
      });
      return;
    }
    lastSaveRef.current = now;
    setSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, address }),
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        notifications.show({
          title: "บันทึกเรียบร้อย",
          message: "อัปเดตข้อมูลของคุณแล้ว",
          color: "green",
          icon: <IconCheck size={16} />,
        });
      } else {
        notifications.show({
          title: "เกิดข้อผิดพลาด",
          message: "ไม่สามารถบันทึกข้อมูลได้",
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
      setSaving(false);
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

  if (!profile) return null;

  return (
    <Container size="sm" py="xl">
      <Title order={2} mb="xl">
        ข้อมูลของฉัน
      </Title>

      <Paper withBorder radius="md" p="xl">
        <Stack gap="lg">
          {/* Profile Header */}
          <Group>
            <Avatar
              src={session?.user?.image}
              size={72}
              radius="xl"
              color="green"
            >
              <IconUser size={32} />
            </Avatar>
            <div>
              <Text size="lg" fw={600}>
                {profile.name ?? "ผู้ใช้"}
              </Text>
              <Text size="sm" c="dimmed">
                {profile.email}
              </Text>
              <Text size="xs" c="dimmed">
                สมาชิกตั้งแต่{" "}
                {new Date(profile.createdAt).toLocaleDateString("th-TH", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </Text>
            </div>
          </Group>

          <Divider />

          {/* Edit Form */}
          <TextInput
            label="ชื่อ"
            placeholder="กรอกชื่อของคุณ"
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            leftSection={<IconUser size={16} />}
            radius="md"
          />

          <TextInput
            label="อีเมล"
            value={profile.email ?? ""}
            readOnly
            leftSection={<IconMail size={16} />}
            radius="md"
          />

          <TextInput
            label="เบอร์โทรศัพท์"
            placeholder="กรอกเบอร์โทรศัพท์"
            value={phone}
            onChange={(e) => setPhone(e.currentTarget.value)}
            leftSection={<IconPhone size={16} />}
            radius="md"
          />

          <Textarea
            label="ที่อยู่จัดส่ง"
            placeholder="กรอกที่อยู่สำหรับจัดส่งสินค้า"
            value={address}
            onChange={(e) => setAddress(e.currentTarget.value)}
            leftSection={<IconMapPin size={16} />}
            minRows={3}
            radius="md"
          />

          <Button
            color="green"
            radius="md"
            leftSection={<IconDeviceFloppy size={18} />}
            onClick={handleSave}
            loading={saving}
          >
            บันทึกข้อมูล
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}
