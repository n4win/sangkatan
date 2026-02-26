"use client";

import { useState, useMemo } from "react";
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
  SegmentedControl,
} from "@mantine/core";
import { IconShoppingBag } from "@tabler/icons-react";

interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  price: string;
  description: string | null;
  images: ProductImage[];
  category: { id: string; name: string } | null;
}

interface Category {
  id: string;
  name: string;
}

interface Props {
  products: Product[];
  categories: Category[];
}

export function ProductsListContent({ products, categories }: Props) {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredProducts = useMemo(() => {
    if (selectedCategory === "all") return products;
    return products.filter((p) => p.category?.id === selectedCategory);
  }, [products, selectedCategory]);

  const categoryOptions = [
    { label: "ทั้งหมด", value: "all" },
    ...categories.map((c) => ({ label: c.name, value: c.id })),
  ];

  return (
    <>
      <Box pos="relative" h={{ base: 200, sm: 300 }}>
        <Image
          src="/img/banner_product1.png"
          alt="สินค้า"
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
              สินค้าสังฆทาน
            </Title>
            <Text c="white" size="lg" ta="center" maw={500} opacity={0.9}>
              ชุดสังฆทานคุณภาพ พร้อมจัดส่งทั่วประเทศ
            </Text>
          </Stack>
        </Box>
      </Box>

      <Container size="lg" py="xl">
        {categories.length > 0 && (
          <Group justify="center" mb="xl">
            <SegmentedControl
              value={selectedCategory}
              onChange={setSelectedCategory}
              data={categoryOptions}
              radius="md"
              color="green"
            />
          </Group>
        )}

        {filteredProducts.length > 0 ? (
          <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="md">
            {filteredProducts.map((product) => {
              const imgUrl = product.images?.[0]?.url;
              return (
                <Card
                  key={product.id}
                  shadow="sm"
                  radius="md"
                  withBorder
                  padding={0}
                  component={Link}
                  href={`/products/${product.slug}`}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <Card.Section pos="relative" h={200} bg="gray.1">
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
                        <IconShoppingBag
                          size={40}
                          color="var(--mantine-color-gray-4)"
                        />
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
                    {product.description && (
                      <Text size="xs" c="dimmed" lineClamp={2}>
                        {product.description}
                      </Text>
                    )}
                    <Text fw={700} size="md" c="green.7">
                      ฿{Number(product.price).toLocaleString()}
                    </Text>
                  </Stack>
                </Card>
              );
            })}
          </SimpleGrid>
        ) : (
          <Stack align="center" py={60} gap="sm">
            <IconShoppingBag size={48} color="var(--mantine-color-gray-4)" />
            <Text c="dimmed" size="lg">
              ยังไม่มีสินค้าในหมวดนี้
            </Text>
          </Stack>
        )}
      </Container>
    </>
  );
}
