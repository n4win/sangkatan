"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useSession } from "next-auth/react";
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
  Badge,
  Card,
  Grid,
  Divider,
  Avatar,
  Rating,
  Modal,
  ActionIcon,
  CloseButton,
  Button,
  NumberInput,
  Textarea,
  Paper,
  Loader,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
  IconArrowLeft,
  IconShoppingBag,
  IconShoppingCartPlus,
  IconPhoto,
  IconStar,
  IconChevronLeft,
  IconChevronRight,
  IconUser,
  IconMinus,
  IconPlus,
  IconLogin,
  IconStarFilled,
  IconCheck,
} from "@tabler/icons-react";
import { dispatchCartUpdate } from "@/utils/cartEvents";

interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
  sortOrder: number;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: { name: string | null; image: string | null };
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: string;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  images: ProductImage[];
  category: { id: string; name: string } | null;
  reviews: Review[];
  _count: { reviews: number };
}

interface Props {
  product: Product;
}

export function ProductDetailContent({ product }: Props) {
  const { data: session } = useSession();
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState(0);
  const [lightboxOpened, { open: openLightbox, close: closeLightbox }] =
    useDisclosure(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Cart state
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [stockLimitOpen, setStockLimitOpen] = useState(false);

  // Review state
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [checkingReview, setCheckingReview] = useState(false);

  const images = product.images;
  const avgRating =
    product.reviews.length > 0
      ? product.reviews.reduce((sum, r) => sum + r.rating, 0) /
        product.reviews.length
      : 0;

  // ตรวจสอบสิทธิ์การรีวิว
  const checkReviewStatus = useCallback(async () => {
    if (!session?.user) return;
    setCheckingReview(true);
    try {
      const res = await fetch(`/api/reviews/check?productId=${product.id}`);
      const data = await res.json();
      setCanReview(data.canReview);
      setHasReviewed(data.hasReviewed);
      if (data.existingReview) {
        setReviewRating(data.existingReview.rating);
        setReviewComment(data.existingReview.comment ?? "");
      }
    } catch {
      // ignore
    } finally {
      setCheckingReview(false);
    }
  }, [session?.user, product.id]);

  useEffect(() => {
    checkReviewStatus();
  }, [checkReviewStatus]);

  // เพิ่มสินค้าลงตะกร้า
  const handleAddToCart = async () => {
    if (!session?.user) {
      router.push(
        `/signin?callbackUrl=${encodeURIComponent(`/products/${product.slug}`)}`,
      );
      return;
    }

    setAddingToCart(true);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, quantity }),
      });
      const data = await res.json();
      if (res.ok) {
        notifications.show({
          title: "เพิ่มลงตะกร้าแล้ว",
          message: `${product.name} x${quantity}`,
          color: "green",
          icon: <IconCheck size={16} />,
        });
        setQuantity(1);
        dispatchCartUpdate();
      } else {
        notifications.show({
          title: "เกิดข้อผิดพลาด",
          message: data.error || "ไม่สามารถเพิ่มสินค้าได้",
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
      setAddingToCart(false);
    }
  };

  // ส่งรีวิว
  const handleSubmitReview = async () => {
    if (reviewRating === 0) {
      notifications.show({
        title: "กรุณาให้คะแนน",
        message: "เลือกจำนวนดาวที่ต้องการให้คะแนน",
        color: "yellow",
      });
      return;
    }

    setSubmittingReview(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          rating: reviewRating,
          comment: reviewComment,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        notifications.show({
          title: hasReviewed ? "อัปเดตรีวิวแล้ว" : "ส่งรีวิวแล้ว",
          message: "ขอบคุณสำหรับรีวิวของคุณ",
          color: "green",
          icon: <IconCheck size={16} />,
        });
        setHasReviewed(true);
        router.refresh();
      } else {
        notifications.show({
          title: "ไม่สามารถส่งรีวิวได้",
          message: data.error || "กรุณาลองใหม่",
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
      setSubmittingReview(false);
    }
  };

  const openImage = (index: number) => {
    setLightboxIndex(index);
    openLightbox();
  };

  const prevImage = () => {
    setLightboxIndex((i) => (i > 0 ? i - 1 : images.length - 1));
  };

  const nextImage = () => {
    setLightboxIndex((i) => (i < images.length - 1 ? i + 1 : 0));
  };

  return (
    <>
      <Container size="lg" py="xl">
        {/* Breadcrumbs */}
        <Breadcrumbs mb="xl">
          <Anchor component={Link} href="/home" size="sm">
            หน้าแรก
          </Anchor>
          <Anchor component={Link} href="/products" size="sm">
            สินค้า
          </Anchor>
          {product.category && (
            <Text size="sm" c="dimmed">
              {product.category.name}
            </Text>
          )}
          <Text size="sm" c="dimmed" lineClamp={1} maw={200}>
            {product.name}
          </Text>
        </Breadcrumbs>

        <Grid gutter="xl">
          {/* Image Gallery */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Stack gap="sm">
              {/* Main Image */}
              <Box
                pos="relative"
                h={{ base: 300, sm: 400 }}
                bg="gray.0"
                style={{
                  borderRadius: "var(--mantine-radius-lg)",
                  overflow: "hidden",
                  cursor: images.length > 0 ? "pointer" : "default",
                }}
                onClick={() => images.length > 0 && openImage(selectedImage)}
              >
                {images[selectedImage] ? (
                  <Image
                    src={images[selectedImage].url}
                    alt={images[selectedImage].alt ?? product.name}
                    fill
                    style={{ objectFit: "contain" }}
                    priority
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
                    <Stack align="center" gap="xs">
                      <IconShoppingBag
                        size={64}
                        color="var(--mantine-color-gray-3)"
                      />
                      <Text c="dimmed" size="sm">
                        ไม่มีรูปสินค้า
                      </Text>
                    </Stack>
                  </Box>
                )}
                {product.isFeatured && (
                  <Badge
                    pos="absolute"
                    top={12}
                    left={12}
                    variant="filled"
                    color="green"
                    size="lg"
                  >
                    แนะนำ
                  </Badge>
                )}
              </Box>

              {/* Thumbnail Strip */}
              {images.length > 1 && (
                <Group gap="xs" justify="center">
                  {images.map((img, i) => (
                    <Box
                      key={img.id}
                      pos="relative"
                      w={64}
                      h={64}
                      bg="gray.0"
                      style={{
                        borderRadius: "var(--mantine-radius-md)",
                        overflow: "hidden",
                        cursor: "pointer",
                        border:
                          i === selectedImage
                            ? "2px solid var(--mantine-color-green-6)"
                            : "2px solid var(--mantine-color-gray-2)",
                        transition: "border-color 150ms ease",
                      }}
                      onClick={() => setSelectedImage(i)}
                    >
                      <Image
                        src={img.url}
                        alt={img.alt ?? `รูปที่ ${i + 1}`}
                        fill
                        style={{ objectFit: "cover" }}
                      />
                    </Box>
                  ))}
                </Group>
              )}
            </Stack>
          </Grid.Col>

          {/* Product Info */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Stack gap="md">
              {product.category && (
                <Badge variant="light" color="green" size="md" w="fit-content">
                  {product.category.name}
                </Badge>
              )}

              <Title order={1} size="h2" lh={1.3}>
                {product.name}
              </Title>

              {product._count.reviews > 0 && (
                <Group gap="xs">
                  <Rating value={avgRating} fractions={2} readOnly size="sm" />
                  <Text size="sm" c="dimmed">
                    ({product._count.reviews} รีวิว)
                  </Text>
                </Group>
              )}

              <Text
                size="2rem"
                fw={700}
                c="green.7"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                ฿{Number(product.price).toLocaleString()}
              </Text>

              <Divider />

              <Stack gap={4}>
                <Text size="sm" fw={600}>
                  สถานะสินค้า
                </Text>
                <Badge
                  variant="light"
                  color={product.stock > 0 ? "green" : "red"}
                  size="md"
                  w="fit-content"
                >
                  {product.stock > 0
                    ? `มีสินค้า (${product.stock})`
                    : "สินค้าหมด"}
                </Badge>
              </Stack>

              {product.description && (
                <>
                  <Divider />
                  <Stack gap={4}>
                    <Text size="sm" fw={600}>
                      รายละเอียดสินค้า
                    </Text>
                    <Text
                      size="sm"
                      c="dimmed"
                      lh={1.8}
                      style={{ whiteSpace: "pre-line" }}
                    >
                      {product.description}
                    </Text>
                  </Stack>
                </>
              )}

              {images.length > 1 && (
                <>
                  <Divider />
                  <Group gap={4}>
                    <IconPhoto size={16} color="var(--mantine-color-dimmed)" />
                    <Text size="sm" c="dimmed">
                      {images.length} รูปภาพ — กดที่รูปเพื่อดูขนาดใหญ่
                    </Text>
                  </Group>
                </>
              )}

              {/* Add to Cart Section */}
              {product.stock > 0 && (
                <>
                  <Divider />
                  <Stack gap="sm">
                    <Text size="sm" fw={600}>
                      จำนวน
                    </Text>
                    <Group gap="xs">
                      <ActionIcon
                        variant="default"
                        size="lg"
                        radius="md"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        disabled={quantity <= 1}
                      >
                        <IconMinus size={16} />
                      </ActionIcon>
                      <NumberInput
                        value={quantity}
                        onChange={(val) => {
                          const raw = Number(val) || 0;
                          if (raw < 1) return;
                          if (raw > product.stock) {
                            setStockLimitOpen(true);
                          }
                          setQuantity(Math.min(raw, product.stock));
                        }}
                        min={1}
                        max={product.stock}
                        clampBehavior="strict"
                        w={70}
                        hideControls
                        ta="center"
                        styles={{
                          input: { textAlign: "center", fontWeight: 600 },
                        }}
                      />
                      <ActionIcon
                        variant="default"
                        size="lg"
                        radius="md"
                        onClick={() => {
                          if (quantity >= product.stock) {
                            setStockLimitOpen(true);
                            return;
                          }
                          setQuantity((q) => Math.min(product.stock, q + 1));
                        }}
                        disabled={quantity >= product.stock}
                      >
                        <IconPlus size={16} />
                      </ActionIcon>
                    </Group>

                    {session?.user ? (
                      <Button
                        size="lg"
                        radius="md"
                        color="green"
                        leftSection={<IconShoppingCartPlus size={20} />}
                        onClick={handleAddToCart}
                        loading={addingToCart}
                        fullWidth
                      >
                        เพิ่มลงตะกร้า
                      </Button>
                    ) : (
                      <Button
                        size="lg"
                        radius="md"
                        variant="outline"
                        color="green"
                        leftSection={<IconLogin size={20} />}
                        component={Link}
                        href={`/signin?callbackUrl=${encodeURIComponent(`/products/${product.slug}`)}`}
                        fullWidth
                      >
                        เข้าสู่ระบบเพื่อสั่งซื้อ
                      </Button>
                    )}
                  </Stack>
                </>
              )}
            </Stack>
          </Grid.Col>
        </Grid>

        {/* Reviews Section */}
        <Stack mt="xl" gap="md">
          <Divider />
          <Group gap="xs">
            <IconStar size={20} color="var(--mantine-color-yellow-6)" />
            <Title order={3}>รีวิวจากผู้ซื้อ ({product._count.reviews})</Title>
          </Group>

          {/* Review Form */}
          {session?.user && (
            <Paper withBorder radius="md" p="md">
              {checkingReview ? (
                <Group justify="center" py="md">
                  <Loader size="sm" color="green" />
                  <Text size="sm" c="dimmed">
                    กำลังตรวจสอบ...
                  </Text>
                </Group>
              ) : canReview ? (
                <Stack gap="sm">
                  <Text size="sm" fw={600}>
                    {hasReviewed ? "แก้ไขรีวิวของคุณ" : "เขียนรีวิว"}
                  </Text>
                  <Group gap="xs">
                    <Text size="sm" c="dimmed">
                      ให้คะแนน:
                    </Text>
                    <Rating
                      value={reviewRating}
                      onChange={setReviewRating}
                      size="md"
                      color="yellow"
                    />
                    {reviewRating > 0 && (
                      <Text size="sm" c="dimmed">
                        {reviewRating}/5
                      </Text>
                    )}
                  </Group>
                  <Textarea
                    placeholder="เขียนความคิดเห็นของคุณ (ไม่บังคับ)"
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.currentTarget.value)}
                    minRows={3}
                    radius="md"
                  />
                  <Button
                    color="green"
                    radius="md"
                    onClick={handleSubmitReview}
                    loading={submittingReview}
                    leftSection={<IconStarFilled size={16} />}
                    w="fit-content"
                  >
                    {hasReviewed ? "อัปเดตรีวิว" : "ส่งรีวิว"}
                  </Button>
                </Stack>
              ) : (
                <Text size="sm" c="dimmed" ta="center" py="xs">
                  เฉพาะผู้ที่สั่งซื้อและได้รับสินค้าแล้วเท่านั้นจึงจะรีวิวได้
                </Text>
              )}
            </Paper>
          )}

          {product.reviews.length > 0 ? (
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              {product.reviews.map((review) => (
                <Card key={review.id} withBorder radius="md" p="md">
                  <Group gap="sm" mb="xs">
                    <Avatar
                      src={review.user.image}
                      radius="xl"
                      size="sm"
                      color="green"
                    >
                      <IconUser size={14} />
                    </Avatar>
                    <div style={{ flex: 1 }}>
                      <Text size="sm" fw={600}>
                        {review.user.name ?? "ผู้ใช้"}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {new Date(review.createdAt).toLocaleDateString(
                          "th-TH",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          },
                        )}
                      </Text>
                    </div>
                    <Rating value={review.rating} readOnly size="xs" />
                  </Group>
                  {review.comment && (
                    <Text size="sm" c="dimmed" lh={1.6}>
                      {review.comment}
                    </Text>
                  )}
                </Card>
              ))}
            </SimpleGrid>
          ) : (
            <Text size="sm" c="dimmed" ta="center" py="lg">
              ยังไม่มีรีวิวสำหรับสินค้านี้
            </Text>
          )}
        </Stack>

        {/* Back button */}
        <Group mt="xl">
          <Anchor
            component={Link}
            href="/products"
            size="sm"
            c="green"
            fw={500}
          >
            <Group gap={4}>
              <IconArrowLeft size={16} />
              กลับไปหน้าสินค้า
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
        {images[lightboxIndex] && (
          <Stack gap="xs" align="center">
            <Box pos="relative" w="100%" mih={400} mah="75vh">
              <Image
                src={images[lightboxIndex].url}
                alt={images[lightboxIndex].alt ?? `รูปที่ ${lightboxIndex + 1}`}
                fill
                style={{ objectFit: "contain" }}
              />
            </Box>

            <Text c="dimmed" size="xs">
              {lightboxIndex + 1} / {images.length}
            </Text>

            {images.length > 1 && (
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

      {/* Shopee-style stock limit modal */}
      <Modal
        opened={stockLimitOpen}
        onClose={() => setStockLimitOpen(false)}
        centered
        radius="md"
        withCloseButton={false}
        size="sm"
        overlayProps={{ backgroundOpacity: 0.4, blur: 2 }}
      >
        <Stack align="center" gap="md" py="md">
          <Text ta="center" size="sm">
            ขออภัย คุณสามารถซื้อสินค้านี้ได้เพียง{" "}
            <Text span fw={700} c="green.7">
              {product.stock}
            </Text>{" "}
            ชิ้น
          </Text>
          <Button
            color="green"
            radius="md"
            fullWidth
            onClick={() => setStockLimitOpen(false)}
          >
            ตกลง
          </Button>
        </Stack>
      </Modal>
    </>
  );
}
