"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import {
  Paper,
  Title,
  Text,
  Button,
  Stack,
  Box,
  Anchor,
  Alert,
} from "@mantine/core";
import { IconBrandGoogle, IconAlertCircle } from "@tabler/icons-react";
import Image from "next/image";

export function SignInContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/home";
  const error = searchParams.get("error");
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    await signIn("google", { callbackUrl: encodeURI(callbackUrl) });
  };

  const errorMessages: Record<string, string> = {
    OAuthAccountNotLinked:
      "อีเมลนี้ถูกใช้กับผู้ให้บริการอื่นแล้ว กรุณาเข้าสู่ระบบด้วยวิธีเดิม",
    Default: "เกิดข้อผิดพลาด กรุณาลองใหม่",
  };

  return (
    <Box
      mih="100vh"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, var(--mantine-color-green-0) 0%, var(--mantine-color-gray-0) 50%, var(--mantine-color-green-0) 100%)",
      }}
    >
      <Paper
        shadow="lg"
        p="xl"
        radius="lg"
        w={{ base: "90%", xs: 420 }}
        withBorder
      >
        <Stack align="center" gap="xs" mb="xl">
          <Image
            src="/icon/logo.png"
            alt="Logo"
            width={64}
            height={64}
            style={{ borderRadius: 14 }}
          />
          <Title order={3} ta="center">
            เข้าสู่ระบบ
          </Title>
          <Text size="sm" c="dimmed" ta="center">
            ศูนย์ร่มโพธิ์ร่มไทรวัยดอกลำดวน
          </Text>
        </Stack>

        {error && (
          <Alert
            color="red"
            variant="light"
            icon={<IconAlertCircle size={16} />}
            mb="md"
            radius="md"
          >
            {errorMessages[error] ?? errorMessages.Default}
          </Alert>
        )}

        <Button
          fullWidth
          variant="default"
          radius="md"
          size="lg"
          leftSection={<IconBrandGoogle size={20} />}
          onClick={handleGoogleSignIn}
          loading={loading}
        >
          เข้าสู่ระบบด้วย Google
        </Button>

        <Text size="xs" c="dimmed" ta="center" mt="xl">
          การเข้าสู่ระบบแสดงว่าคุณยอมรับ{" "}
          <Anchor size="xs" href="#">
            เงื่อนไขการใช้งาน
          </Anchor>
        </Text>
      </Paper>
    </Box>
  );
}
