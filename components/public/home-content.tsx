"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Container,
  Title,
  Text,
  SimpleGrid,
  Card,
  Group,
  Badge,
  Button,
  Stack,
  Box,
} from "@mantine/core";
import { Carousel } from "@mantine/carousel";
import {
  IconArrowRight,
  IconCalendarEvent,
  IconPhoto,
  IconShoppingBag,
} from "@tabler/icons-react";

interface Banner {
  id: string;
  title: string | null;
  image: string;
  link: string | null;
}

interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
}

interface FeaturedProduct {
  id: string;
  name: string;
  slug: string;
  price: string;
  images: ProductImage[];
  category: { name: string } | null;
}

interface LatestActivity {
  id: string;
  title: string;
  content: string;
  coverImage: string | null;
  slug: string;
  publishedAt: string | null;
  _count: { images: number };
}

interface HomeContentProps {
  banners: Banner[];
  featuredProducts: FeaturedProduct[];
  latestActivities: LatestActivity[];
}

function BannerSection({ banners }: { banners: Banner[] }) {
  if (banners.length === 0) {
    return (
      <Box
        h={{ base: 200, sm: 350, md: 450 }}
        bg="green.1"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Stack align="center" gap="xs">
          <IconPhoto size={48} color="var(--mantine-color-green-4)" />
          <Text c="green.6" fw={500}>
            ยังไม่มีแบนเนอร์
          </Text>
        </Stack>
      </Box>
    );
  }

  if (banners.length === 1) {
    const b = banners[0];
    return (
      <Box pos="relative" h={{ base: 200, sm: 350, md: 450 }}>
        <Image
          src={b.image}
          alt={b.title ?? "banner"}
          fill
          style={{ objectFit: "cover" }}
          priority
        />
      </Box>
    );
  }

  return (
    <Carousel
      withIndicators
      withControls={banners.length > 1}
      height={450}
      styles={{
        indicator: { backgroundColor: "var(--mantine-color-green-6)" },
        root: { maxHeight: "50vw" },
      }}
    >
      {banners.map((b) => (
        <Carousel.Slide key={b.id}>
          <Box pos="relative" h="100%">
            {b.link ? (
              <Link href={b.link}>
                <Image
                  src={b.image}
                  alt={b.title ?? "banner"}
                  fill
                  style={{ objectFit: "cover" }}
                />
              </Link>
            ) : (
              <Image
                src={b.image}
                alt={b.title ?? "banner"}
                fill
                style={{ objectFit: "cover" }}
              />
            )}
          </Box>
        </Carousel.Slide>
      ))}
    </Carousel>
  );
}

function ProductCard({ product }: { product: FeaturedProduct }) {
  const imgUrl = product.images?.[0]?.url;
  return (
    <Card
      shadow="sm"
      radius="md"
      withBorder
      padding={0}
      component={Link}
      href={`/products/${product.slug}`}
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <Card.Section pos="relative" h={180} bg="gray.1">
        {imgUrl ? (
          <Image
            src={imgUrl}
            alt={product.name}
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
            <IconShoppingBag size={40} color="var(--mantine-color-gray-4)" />
          </Box>
        )}
        {product.category && (
          <Badge
            pos="absolute"
            top={8}
            left={8}
            variant="light"
            color="green"
            size="sm"
          >
            {product.category.name}
          </Badge>
        )}
      </Card.Section>
      <Stack gap={4} p="sm">
        <Text fw={600} size="sm" lineClamp={2} lh={1.3}>
          {product.name}
        </Text>
        <Text fw={700} size="md" c="green.7">
          ฿{Number(product.price).toLocaleString()}
        </Text>
      </Stack>
    </Card>
  );
}

function ActivityCard({ activity }: { activity: LatestActivity }) {
  return (
    <Card
      shadow="sm"
      radius="md"
      withBorder
      padding={0}
      component={Link}
      href={`/activities/${activity.slug}`}
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <Card.Section pos="relative" h={180} bg="gray.1">
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
            <IconCalendarEvent size={40} color="var(--mantine-color-gray-4)" />
          </Box>
        )}
        {activity._count.images > 0 && (
          <Badge
            pos="absolute"
            top={8}
            right={8}
            variant="filled"
            color="dark"
            size="sm"
            leftSection={<IconPhoto size={12} />}
          >
            {activity._count.images}
          </Badge>
        )}
      </Card.Section>
      <Stack gap={4} p="sm">
        <Text fw={600} size="sm" lineClamp={2} lh={1.3}>
          {activity.title}
        </Text>
        <Text size="xs" c="dimmed" lineClamp={2}>
          {activity.content.replace(/<[^>]*>/g, "").slice(0, 100)}
        </Text>
        {activity.publishedAt && (
          <Text size="xs" c="dimmed">
            {new Date(activity.publishedAt).toLocaleDateString("th-TH", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </Text>
        )}
      </Stack>
    </Card>
  );
}

export function HomeContent({
  banners,
  featuredProducts,
  latestActivities,
}: HomeContentProps) {
  return (
    <>
      <BannerSection banners={banners} />

      {/* Featured Products */}
      <Container size="lg" py="xl">
        <Group justify="space-between" align="center" mb="lg">
          <div>
            <Text size="sm" c="green.6" fw={600} tt="uppercase">
              สินค้าแนะนำ
            </Text>
            <Title order={2}>สินค้าสังฆทาน</Title>
          </div>
          <Button
            variant="subtle"
            rightSection={<IconArrowRight size={16} />}
            component={Link}
            href="/products"
          >
            ดูทั้งหมด
          </Button>
        </Group>

        {featuredProducts.length > 0 ? (
          <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="md">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </SimpleGrid>
        ) : (
          <Text ta="center" c="dimmed" py="xl">
            ยังไม่มีสินค้าแนะนำ
          </Text>
        )}
      </Container>

      {/* Latest Activities */}
      <Box bg="gray.0" py="xl">
        <Container size="lg">
          <Group justify="space-between" align="center" mb="lg">
            <div>
              <Text size="sm" c="green.6" fw={600} tt="uppercase">
                กิจกรรมล่าสุด
              </Text>
              <Title order={2}>กิจกรรม & ข่าวสาร</Title>
            </div>
            <Button
              variant="subtle"
              rightSection={<IconArrowRight size={16} />}
              component={Link}
              href="/activities"
            >
              ดูทั้งหมด
            </Button>
          </Group>

          {latestActivities.length > 0 ? (
            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
              {latestActivities.map((activity) => (
                <ActivityCard key={activity.id} activity={activity} />
              ))}
            </SimpleGrid>
          ) : (
            <Text ta="center" c="dimmed" py="xl">
              ยังไม่มีกิจกรรม
            </Text>
          )}
        </Container>
      </Box>
    </>
  );
}
