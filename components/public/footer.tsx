"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Container,
  Group,
  Stack,
  Text,
  Divider,
  SimpleGrid,
  Anchor,
} from "@mantine/core";
import {
  IconPhone,
  IconBrandFacebook,
  IconMapPin,
  IconClock,
} from "@tabler/icons-react";
import classes from "@/styles/footer.module.css";

const quickLinks = [
  { label: "หน้าแรก", href: "/home" },
  { label: "สินค้า", href: "/products" },
  { label: "กิจกรรม", href: "/activities" },
  { label: "ประวัติ", href: "/about" },
  { label: "ติดต่อเรา", href: "/contact" },
];

export function Footer() {
  return (
    <footer className={classes.footer}>
      <Container size="lg" py="xl">
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xl">
          <Stack gap="sm">
            <Group gap="sm">
              <Image src="/icon/logo.png" alt="logo" width={36} height={36} />
              <Text fw={700} size="md">
                ศูนย์ร่มโพธิ์ร่มไทรวัยดอกลำดวน
              </Text>
            </Group>
            <Text size="sm" c="dimmed" maw={300}>
              สังฆทานออนไลน์ ศูนย์ร่มโพธิ์ร่มไทรวัยดอกลำดวน
              จำหน่ายชุดสังฆทานคุณภาพ พร้อมจัดส่งทั่วประเทศ
            </Text>
          </Stack>

          <Stack gap="xs">
            <Text fw={600} size="sm" mb={4}>
              ลิงก์ด่วน
            </Text>
            {quickLinks.map((link) => (
              <Anchor
                key={link.href}
                component={Link}
                href={link.href}
                size="sm"
                c="dimmed"
                underline="hover"
              >
                {link.label}
              </Anchor>
            ))}
          </Stack>

          <Stack gap="xs">
            <Text fw={600} size="sm" mb={4}>
              ติดต่อเรา
            </Text>
            <Group gap="xs" wrap="nowrap">
              <IconPhone size={16} color="var(--mantine-color-green-6)" />
              <Text size="sm" c="dimmed">
                081-043-5031 , 098-974-5553
              </Text>
            </Group>
            <Group gap="xs" wrap="nowrap">
              <IconBrandFacebook
                size={16}
                color="var(--mantine-color-green-6)"
              />
              <Text size="sm" c="dimmed">
                ชฎาพร ทองธรรมชาติ (Facebook)
              </Text>
            </Group>
            <Group gap="xs" wrap="nowrap" align="flex-start">
              <IconMapPin
                size={16}
                color="var(--mantine-color-green-6)"
                style={{ flexShrink: 0, marginTop: 3 }}
              />
              <Text size="sm" c="dimmed">
                วัดทุ่งเศรษฐี 202/16 หมู่ที่ 3 ต.นครชุม อ.เมือง จ.กำแพงเพชร
                62000
              </Text>
            </Group>
            <Group gap="xs" wrap="nowrap">
              <IconClock size={16} color="var(--mantine-color-green-6)" />
              <Text size="sm" c="dimmed">
                เปิดทุกวัน 08:00 - 17:00
              </Text>
            </Group>
          </Stack>
        </SimpleGrid>

        <Divider my="lg" />

        <Text ta="center" size="xs" c="dimmed">
          © {new Date().getFullYear()} ศูนย์ร่มโพธิ์ร่มไทรวัยดอกลำดวน
          สงวนลิขสิทธิ์
        </Text>
      </Container>
    </footer>
  );
}
