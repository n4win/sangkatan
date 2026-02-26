"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Container,
  Title,
  Text,
  SimpleGrid,
  Card,
  Stack,
  Badge,
  Box,
  Group,
} from "@mantine/core";
import { IconCalendarEvent, IconPhoto } from "@tabler/icons-react";

interface Activity {
  id: string;
  title: string;
  content: string;
  coverImage: string | null;
  slug: string;
  publishedAt: string | null;
  _count: { images: number };
}

interface Props {
  activities: Activity[];
}

export function ActivitiesListContent({ activities }: Props) {
  return (
    <>
      <Box pos="relative" h={{ base: 200, sm: 300 }}>
        <Image
          src="/img/banner_gallery.png"
          alt="กิจกรรม"
          fill
          style={{ objectFit: "cover" }}
          priority
        />
        <Box
          pos="absolute"
          inset={0}
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.5))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Stack align="center" gap={4}>
            <Title order={1} c="white" ta="center">
              กิจกรรม & ข่าวสาร
            </Title>
            <Text c="white" size="lg" ta="center" maw={500} opacity={0.9}>
              รวมกิจกรรมและข่าวสารล่าสุดจากศูนย์ฯ
            </Text>
          </Stack>
        </Box>
      </Box>

      <Container size="lg" py="xl">
        {activities.length > 0 ? (
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
            {activities.map((activity) => (
              <Card
                key={activity.id}
                shadow="sm"
                radius="md"
                withBorder
                padding={0}
                component={Link}
                href={`/activities/${activity.slug}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <Card.Section pos="relative" h={220} bg="gray.1">
                  {activity.coverImage ? (
                    <Image
                      src={activity.coverImage}
                      alt={activity.title}
                      fill
                      style={{ objectFit: "cover" }}
                    />
                  ) : (
                    <Box
                      h="100%"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <IconCalendarEvent
                        size={48}
                        color="var(--mantine-color-gray-4)"
                      />
                    </Box>
                  )}
                  {activity._count.images > 0 && (
                    <Badge
                      pos="absolute"
                      top={10}
                      right={10}
                      variant="filled"
                      color="dark"
                      size="sm"
                      leftSection={<IconPhoto size={12} />}
                    >
                      {activity._count.images} รูป
                    </Badge>
                  )}
                </Card.Section>

                <Stack gap={6} p="md">
                  <Text fw={600} size="md" lineClamp={2} lh={1.4}>
                    {activity.title}
                  </Text>
                  <Text size="sm" c="dimmed" lineClamp={3} lh={1.6}>
                    {activity.content.replace(/<[^>]*>/g, "").slice(0, 150)}
                  </Text>
                  {activity.publishedAt && (
                    <Group gap={6} mt={4}>
                      <IconCalendarEvent
                        size={14}
                        color="var(--mantine-color-dimmed)"
                      />
                      <Text size="xs" c="dimmed">
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
                </Stack>
              </Card>
            ))}
          </SimpleGrid>
        ) : (
          <Stack align="center" py={60} gap="sm">
            <IconCalendarEvent size={48} color="var(--mantine-color-gray-4)" />
            <Text c="dimmed" size="lg">
              ยังไม่มีกิจกรรม
            </Text>
          </Stack>
        )}
      </Container>
    </>
  );
}
