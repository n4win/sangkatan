"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Container,
  Title,
  Text,
  Stack,
  Group,
  SimpleGrid,
  Box,
  Breadcrumbs,
  Anchor,
  Modal,
  ActionIcon,
  CloseButton,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconCalendarEvent,
  IconPhoto,
  IconArrowLeft,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";

interface ActivityImage {
  id: string;
  url: string;
  caption: string | null;
  sortOrder: number;
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
  createdAt: string;
}

interface Props {
  activity: Activity;
}

export function ActivityDetailContent({ activity }: Props) {
  const [lightboxOpened, { open: openLightbox, close: closeLightbox }] =
    useDisclosure(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const allImages = activity.images;

  const openImage = (index: number) => {
    setLightboxIndex(index);
    openLightbox();
  };

  const prevImage = () => {
    setLightboxIndex((i) => (i > 0 ? i - 1 : allImages.length - 1));
  };

  const nextImage = () => {
    setLightboxIndex((i) => (i < allImages.length - 1 ? i + 1 : 0));
  };

  return (
    <>
      {/* Cover Image */}
      {activity.coverImage && (
        <Box pos="relative" h={{ base: 250, sm: 400 }}>
          <Image
            src={activity.coverImage}
            alt={activity.title}
            fill
            style={{ objectFit: "cover" }}
            priority
          />
          <Box
            pos="absolute"
            inset={0}
            style={{
              background:
                "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)",
            }}
          />
          <Box
            pos="absolute"
            bottom={0}
            left={0}
            right={0}
            p="xl"
          >
            <Container size="lg">
              <Title order={1} c="white" size="h2">
                {activity.title}
              </Title>
              {activity.publishedAt && (
                <Group gap={6} mt="xs">
                  <IconCalendarEvent size={16} color="white" opacity={0.8} />
                  <Text c="white" size="sm" opacity={0.8}>
                    {new Date(activity.publishedAt).toLocaleDateString(
                      "th-TH",
                      {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      },
                    )}
                  </Text>
                </Group>
              )}
            </Container>
          </Box>
        </Box>
      )}

      <Container size="lg" py="xl">
        {/* Breadcrumbs */}
        <Breadcrumbs mb="lg">
          <Anchor component={Link} href="/home" size="sm">
            หน้าแรก
          </Anchor>
          <Anchor component={Link} href="/activities" size="sm">
            กิจกรรม
          </Anchor>
          <Text size="sm" c="dimmed" lineClamp={1} maw={200}>
            {activity.title}
          </Text>
        </Breadcrumbs>

        {/* Title (shown when no cover image) */}
        {!activity.coverImage && (
          <Stack gap="xs" mb="xl">
            <Title order={1} size="h2">
              {activity.title}
            </Title>
            {activity.publishedAt && (
              <Group gap={6}>
                <IconCalendarEvent
                  size={16}
                  color="var(--mantine-color-dimmed)"
                />
                <Text c="dimmed" size="sm">
                  {new Date(activity.publishedAt).toLocaleDateString("th-TH", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </Text>
              </Group>
            )}
          </Stack>
        )}

        {/* Content */}
        <Box
          mb="xl"
          style={{ lineHeight: 1.8, fontSize: "var(--mantine-font-size-md)" }}
          dangerouslySetInnerHTML={{ __html: activity.content }}
        />

        {/* Gallery */}
        {allImages.length > 0 && (
          <Stack gap="md">
            <Group gap="xs">
              <IconPhoto size={20} color="var(--mantine-color-green-6)" />
              <Title order={3}>แกลเลอรี่ ({allImages.length} รูป)</Title>
            </Group>

            <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="md">
              {allImages.map((img, index) => (
                <Box
                  key={img.id}
                  pos="relative"
                  h={{ base: 150, sm: 200 }}
                  bg="gray.1"
                  style={{
                    borderRadius: "var(--mantine-radius-md)",
                    overflow: "hidden",
                    cursor: "pointer",
                  }}
                  onClick={() => openImage(index)}
                >
                  <Image
                    src={img.url}
                    alt={img.caption ?? `รูปที่ ${index + 1}`}
                    fill
                    style={{ objectFit: "cover" }}
                  />
                </Box>
              ))}
            </SimpleGrid>
          </Stack>
        )}

        {/* Back button */}
        <Group mt="xl">
          <Anchor
            component={Link}
            href="/activities"
            size="sm"
            c="green"
            fw={500}
          >
            <Group gap={4}>
              <IconArrowLeft size={16} />
              กลับไปหน้ากิจกรรม
            </Group>
          </Anchor>
        </Group>
      </Container>

      {/* Lightbox Modal */}
      <Modal
        opened={lightboxOpened}
        onClose={closeLightbox}
        size="xl"
        padding={0}
        withCloseButton={false}
        centered
        overlayProps={{ backgroundOpacity: 0.85, blur: 4 }}
        radius="lg"
        styles={{
          body: { position: "relative" },
          content: { background: "transparent", boxShadow: "none" },
        }}
      >
        {allImages[lightboxIndex] && (
          <Stack gap="xs" align="center">
            <Box pos="relative" w="100%" mih={300} mah="70vh">
              <Image
                src={allImages[lightboxIndex].url}
                alt={
                  allImages[lightboxIndex].caption ??
                  `รูปที่ ${lightboxIndex + 1}`
                }
                fill
                style={{ objectFit: "contain" }}
              />
            </Box>

            {allImages[lightboxIndex].caption && (
              <Text c="white" size="sm" ta="center">
                {allImages[lightboxIndex].caption}
              </Text>
            )}

            <Text c="dimmed" size="xs">
              {lightboxIndex + 1} / {allImages.length}
            </Text>

            {/* Navigation */}
            {allImages.length > 1 && (
              <>
                <ActionIcon
                  variant="filled"
                  color="dark"
                  size="lg"
                  radius="xl"
                  pos="absolute"
                  top="50%"
                  left={8}
                  style={{ transform: "translateY(-50%)", zIndex: 10 }}
                  onClick={prevImage}
                >
                  <IconChevronLeft size={20} />
                </ActionIcon>
                <ActionIcon
                  variant="filled"
                  color="dark"
                  size="lg"
                  radius="xl"
                  pos="absolute"
                  top="50%"
                  right={8}
                  style={{ transform: "translateY(-50%)", zIndex: 10 }}
                  onClick={nextImage}
                >
                  <IconChevronRight size={20} />
                </ActionIcon>
              </>
            )}

            <CloseButton
              pos="absolute"
              top={8}
              right={8}
              variant="filled"
              color="dark"
              size="lg"
              radius="xl"
              onClick={closeLightbox}
              style={{ zIndex: 10 }}
            />
          </Stack>
        )}
      </Modal>
    </>
  );
}
