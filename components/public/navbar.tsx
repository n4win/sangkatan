"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Group,
  Burger,
  Container,
  Drawer,
  Stack,
  UnstyledButton,
  Text,
  Avatar,
  Menu,
  Button,
  Divider,
  Indicator,
  ActionIcon,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconUser,
  IconShoppingBag,
  IconShoppingCart,
  IconLogout,
  IconLogin,
  IconChevronDown,
} from "@tabler/icons-react";
import { CART_UPDATED_EVENT } from "@/utils/cartEvents";
import classes from "@/styles/navbar.module.css";

const links = [
  { label: "หน้าแรก", href: "/home" },
  { label: "สินค้า", href: "/products" },
  { label: "กิจกรรม", href: "/activities" },
  { label: "ประวัติ", href: "/about" },
  { label: "ติดต่อเรา", href: "/contact" },
];

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [opened, { toggle, close }] = useDisclosure(false);
  const [cartCount, setCartCount] = useState(0);

  const fetchCartCount = useCallback(async () => {
    try {
      const res = await fetch("/api/cart/count");
      const data = await res.json();
      setCartCount(data.count ?? 0);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (session?.user) {
      fetchCartCount();
    } else {
      setCartCount(0);
    }
  }, [session?.user, fetchCartCount, pathname]);

  // ฟังก์ custom event เพื่ออัปเดต cart count แบบ realtime
  useEffect(() => {
    const handler = () => fetchCartCount();
    window.addEventListener(CART_UPDATED_EVENT, handler);
    return () => window.removeEventListener(CART_UPDATED_EVENT, handler);
  }, [fetchCartCount]);

  return (
    <header className={classes.header}>
      <Container size="lg" h="100%">
        <Group h="100%" justify="space-between">
          <Link href="/home" className={classes.logo}>
            <Image
              src="/icon/logo.png"
              alt="ศูนย์ร่มโพธิ์ร่มไทรวัยดอกลำดวน"
              width={40}
              height={40}
            />
            <Text fw={700} size="sm" visibleFrom="sm" lineClamp={1}>
              ศูนย์ร่มโพธิ์ร่มไทรวัยดอกลำดวน
            </Text>
          </Link>

          <Group gap={4} visibleFrom="sm">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={classes.link}
                data-active={pathname === link.href || undefined}
              >
                {link.label}
              </Link>
            ))}
          </Group>

          <Group gap="sm">
            {/* Cart Icon */}
            {session?.user && (
              <Indicator
                label={cartCount}
                size={16}
                disabled={cartCount === 0}
                color="green"
                offset={4}
                processing={false}
              >
                <ActionIcon
                  variant="subtle"
                  color="dark"
                  size="lg"
                  radius="md"
                  component={Link}
                  href="/cart"
                >
                  <IconShoppingCart size={22} />
                </ActionIcon>
              </Indicator>
            )}

            {/* User Menu - Desktop */}
            {session?.user ? (
              <Menu
                withArrow
                shadow="md"
                position="bottom-end"
                radius="md"
                transitionProps={{ transition: "pop-top-right" }}
              >
                <Menu.Target>
                  <UnstyledButton className={classes.userButton}>
                    <Group gap="xs">
                      <Avatar
                        src={session.user.image}
                        size={32}
                        radius="xl"
                        color="green"
                      >
                        <IconUser size={16} />
                      </Avatar>
                      <Text
                        size="sm"
                        fw={500}
                        visibleFrom="sm"
                        lineClamp={1}
                        maw={120}
                      >
                        {session.user.name ?? "ผู้ใช้"}
                      </Text>
                      <IconChevronDown
                        size={14}
                        style={{ display: "none" }}
                        className={classes.chevronIcon}
                      />
                    </Group>
                  </UnstyledButton>
                </Menu.Target>

                <Menu.Dropdown>
                  <Menu.Item
                    leftSection={<IconUser size={16} />}
                    component={Link}
                    href="/profile"
                  >
                    ข้อมูลของฉัน
                  </Menu.Item>
                  <Menu.Item
                    leftSection={<IconShoppingBag size={16} />}
                    component={Link}
                    href="/orders"
                  >
                    การซื้อของฉัน
                  </Menu.Item>

                  <Menu.Divider />

                  <Menu.Item
                    leftSection={<IconLogout size={16} />}
                    color="red"
                    onClick={() => signOut({ callbackUrl: "/home" })}
                  >
                    ออกจากระบบ
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            ) : (
              <Button
                component={Link}
                href="/signin"
                variant="light"
                color="green"
                radius="md"
                size="xs"
                leftSection={<IconLogin size={16} />}
              >
                <Text visibleFrom="sm">เข้าสู่ระบบ</Text>
                <Text hiddenFrom="sm" size="xs">
                  เข้าสู่ระบบ
                </Text>
              </Button>
            )}

            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
            />
          </Group>
        </Group>
      </Container>

      <Drawer
        opened={opened}
        onClose={close}
        title={
          <Group gap="xs">
            <Image src="/icon/logo.png" alt="logo" width={32} height={32} />
            <Text fw={700} size="sm">
              ศูนย์ร่มโพธิ์ร่มไทรวัยดอกลำดวน
            </Text>
          </Group>
        }
        hiddenFrom="sm"
        size="xs"
      >
        <Stack gap={0}>
          {links.map((link) => (
            <UnstyledButton
              key={link.href}
              component={Link}
              href={link.href}
              className={classes.drawerLink}
              data-active={pathname === link.href || undefined}
              onClick={close}
            >
              {link.label}
            </UnstyledButton>
          ))}

          {session?.user && (
            <>
              <Divider my="sm" />
              <UnstyledButton
                component={Link}
                href="/profile"
                className={classes.drawerLink}
                data-active={pathname === "/profile" || undefined}
                onClick={close}
              >
                <Group gap="xs">
                  <IconUser size={16} />
                  ข้อมูลของฉัน
                </Group>
              </UnstyledButton>
              <UnstyledButton
                component={Link}
                href="/cart"
                className={classes.drawerLink}
                data-active={pathname === "/cart" || undefined}
                onClick={close}
              >
                <Group gap="xs">
                  <IconShoppingCart size={16} />
                  ตะกร้าสินค้า
                  {cartCount > 0 && (
                    <Text size="xs" c="green" fw={700}>
                      ({cartCount})
                    </Text>
                  )}
                </Group>
              </UnstyledButton>
              <UnstyledButton
                component={Link}
                href="/orders"
                className={classes.drawerLink}
                data-active={pathname === "/orders" || undefined}
                onClick={close}
              >
                <Group gap="xs">
                  <IconShoppingBag size={16} />
                  การซื้อของฉัน
                </Group>
              </UnstyledButton>
              <UnstyledButton
                className={classes.drawerLink}
                onClick={() => {
                  close();
                  signOut({ callbackUrl: "/home" });
                }}
                style={{ color: "var(--mantine-color-red-6)" }}
              >
                <Group gap="xs">
                  <IconLogout size={16} />
                  ออกจากระบบ
                </Group>
              </UnstyledButton>
            </>
          )}
        </Stack>
      </Drawer>
    </header>
  );
}
