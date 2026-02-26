"use client";

import Link from "next/link";
import { Container, Title, Text, Button, Stack, Group } from "@mantine/core";
import { IconHome, IconArrowLeft } from "@tabler/icons-react";

export default function NotFound() {
  return (
    <Container size="sm" py={80}>
      <Stack align="center" gap="lg">
        <Title
          order={1}
          ta="center"
          style={{ fontSize: "6rem", lineHeight: 1 }}
          c="dimmed"
        >
          404
        </Title>
        <Title order={2} ta="center">
          ไม่พบหน้าที่ต้องการ
        </Title>
        <Text c="dimmed" ta="center" maw={500}>
          หน้าที่คุณกำลังค้นหาอาจถูกย้าย ลบออก หรือไม่เคยมีอยู่ กรุณาตรวจสอบ URL
          อีกครั้ง
        </Text>
        <Group>
          <Button
            component={Link}
            href="/home"
            variant="filled"
            color="green"
            leftSection={<IconHome size={18} />}
          >
            กลับหน้าแรก
          </Button>
          <Button
            component={Link}
            href="/products"
            variant="light"
            color="gray"
            leftSection={<IconArrowLeft size={18} />}
          >
            ดูสินค้า
          </Button>
        </Group>
      </Stack>
    </Container>
  );
}
