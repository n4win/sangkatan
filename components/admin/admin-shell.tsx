"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  AppShell,
  Burger,
  Group,
  NavLink,
  ScrollArea,
  Text,
  Divider,
  Avatar,
  Stack,
  Box,
  Badge,
  ThemeIcon,
  Tooltip,
  UnstyledButton,
  rem,
  Menu,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useSession, signOut } from "next-auth/react";
import {
  IconDashboard,
  IconPackage,
  IconUsers,
  IconShoppingCart,
  IconPhoto,
  IconCategory,
  IconCalendarEvent,
  IconHome,
  IconLogout,
  IconBell,
  IconChevronDown,
} from "@tabler/icons-react";

const navItems = [
  {
    label: "แดชบอร์ด",
    href: "/admin",
    icon: IconDashboard,
    color: "blue",
    description: "ภาพรวมระบบ",
  },
  {
    label: "หมวดหมู่",
    href: "/admin/categories",
    icon: IconCategory,
    color: "grape",
    description: "จัดการหมวดหมู่",
  },
  {
    label: "สินค้า",
    href: "/admin/products",
    icon: IconPackage,
    color: "teal",
    description: "จัดการสินค้าทั้งหมด",
  },
  {
    label: "ผู้ใช้งาน",
    href: "/admin/users",
    icon: IconUsers,
    color: "violet",
    description: "จัดการสมาชิก",
  },
  {
    label: "ออเดอร์",
    href: "/admin/orders",
    icon: IconShoppingCart,
    color: "orange",
    description: "จัดการคำสั่งซื้อ",
  },
  {
    label: "แบนเนอร์",
    href: "/admin/banners",
    icon: IconPhoto,
    color: "pink",
    description: "จัดการรูปแบนเนอร์",
  },
  {
    label: "กิจกรรม",
    href: "/admin/activities",
    icon: IconCalendarEvent,
    color: "cyan",
    description: "จัดการกิจกรรม & แกลเลอรี่",
  },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [opened, { toggle, close }] = useDisclosure();
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <AppShell
      header={{ height: 64 }}
      navbar={{
        width: 280,
        breakpoint: "sm",
        collapsed: { mobile: !opened },
      }}
      padding="lg"
    >
      <AppShell.Header
        style={{
          borderBottom: "1px solid var(--mantine-color-gray-2)",
          backdropFilter: "blur(8px)",
          backgroundColor: "rgba(255,255,255,0.9)",
        }}
      >
        <Group h="100%" px="md" justify="space-between">
          <Group gap="sm">
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
            />
            <Group gap={8}>
              <Image
                src="/icon/logo.png"
                alt="Logo"
                width={40}
                height={40}
                style={{ borderRadius: 8 }}
              />
              <Box visibleFrom="xs">
                <Text size="sm" fw={700} lh={1.2}>
                  ศูนย์ร่มโพธิ์ร่มไทรวัยดอกลำดวน
                </Text>
                <Text size="xs" c="dimmed" lh={1.2}>
                  ระบบจัดการข้อมูลหลังบ้าน
                </Text>
              </Box>
            </Group>
          </Group>

          <Group gap="sm">
            <Tooltip label="การแจ้งเตือน">
              <UnstyledButton style={{ position: "relative" }}>
                <ThemeIcon variant="light" color="gray" size="lg" radius="xl">
                  <IconBell size={18} />
                </ThemeIcon>
              </UnstyledButton>
            </Tooltip>
            <Menu
              shadow="md"
              width={200}
              position="bottom-end"
              radius="md"
              withArrow
            >
              <Menu.Target>
                <UnstyledButton>
                  <Group gap={6}>
                    <Avatar
                      src={session?.user?.image}
                      radius="xl"
                      color="green"
                      size="md"
                    >
                      {(session?.user?.name ??
                        session?.user?.email ??
                        "A")[0]?.toUpperCase()}
                    </Avatar>
                    <Box visibleFrom="sm">
                      <Text size="sm" fw={500} lh={1.2}>
                        {session?.user?.name ?? "Admin"}
                      </Text>
                      <Text size="xs" c="dimmed" lh={1.2}>
                        {session?.user?.email}
                      </Text>
                    </Box>
                    <IconChevronDown
                      size={14}
                      color="var(--mantine-color-gray-5)"
                    />
                  </Group>
                </UnstyledButton>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item
                  color="red"
                  leftSection={<IconLogout size={14} />}
                  onClick={() => signOut({ callbackUrl: "/signin" })}
                >
                  ออกจากระบบ
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar
        p="sm"
        style={{
          borderRight: "1px solid var(--mantine-color-gray-2)",
          backgroundColor: "white",
        }}
      >
        <AppShell.Section grow component={ScrollArea} scrollbarSize={6}>
          <Stack gap={2}>
            {navItems.map((item) => {
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);

              return (
                <NavLink
                  key={item.href}
                  component={Link}
                  href={item.href}
                  label={
                    <Text size="sm" fw={isActive ? 600 : 400}>
                      {item.label}
                    </Text>
                  }
                  description={
                    <Text size="xs" c="dimmed">
                      {item.description}
                    </Text>
                  }
                  leftSection={
                    <ThemeIcon
                      variant={isActive ? "filled" : "light"}
                      color={item.color}
                      size={32}
                      radius="md"
                    >
                      <item.icon
                        style={{ width: rem(16), height: rem(16) }}
                        stroke={1.8}
                      />
                    </ThemeIcon>
                  }
                  rightSection={
                    isActive ? (
                      <Box
                        w={4}
                        h={20}
                        style={{
                          borderRadius: 4,
                          backgroundColor: `var(--mantine-color-${item.color}-6)`,
                        }}
                      />
                    ) : null
                  }
                  active={isActive}
                  onClick={close}
                  variant="light"
                  style={{ borderRadius: "var(--mantine-radius-md)" }}
                  py={8}
                />
              );
            })}
          </Stack>
        </AppShell.Section>

        <AppShell.Section>
          <Divider my="sm" />
          <NavLink
            component={Link}
            href="/"
            label={
              <Text size="sm" fw={400}>
                กลับหน้าหลัก
              </Text>
            }
            leftSection={
              <ThemeIcon variant="light" color="gray" size={32} radius="md">
                <IconHome
                  style={{ width: rem(16), height: rem(16) }}
                  stroke={1.8}
                />
              </ThemeIcon>
            }
            style={{ borderRadius: "var(--mantine-radius-md)" }}
            py={8}
          />
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main bg="gray.0">{children}</AppShell.Main>
    </AppShell>
  );
}
