import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductDetailContent } from "@/components/public/product-detail-content";
import { ProductJsonLd, BreadcrumbJsonLd } from "@/components/public/json-ld";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const product = await prisma.product.findUnique({
    where: { slug },
    select: {
      name: true,
      description: true,
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
    },
  });

  if (!product) return { title: "ไม่พบสินค้า" };

  const description =
    product.description?.slice(0, 160) ||
    `${product.name} - สินค้าจากศูนย์ร่มโพธิ์ร่มไทรวัยดอกลำดวน`;
  const image = product.images[0]?.url;

  return {
    title: product.name,
    description,
    openGraph: {
      title: product.name,
      description,
      ...(image && { images: [{ url: image, alt: product.name }] }),
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);

  const product = await prisma.product.findUnique({
    where: { slug, isActive: true },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      category: { select: { id: true, name: true } },
      reviews: {
        include: { user: { select: { name: true, image: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      _count: { select: { reviews: true } },
    },
  });

  if (!product) notFound();

  const avgRating =
    product.reviews.length > 0
      ? product.reviews.reduce((sum, r) => sum + r.rating, 0) /
        product.reviews.length
      : undefined;

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "หน้าแรก", href: "/home" },
          { name: "สินค้า", href: "/products" },
          { name: product.name, href: `/products/${product.slug}` },
        ]}
      />
      <ProductJsonLd
        name={product.name}
        description={product.description}
        price={String(product.price)}
        image={product.images[0]?.url}
        slug={product.slug}
        reviewCount={product._count.reviews}
        ratingValue={avgRating}
      />
      <ProductDetailContent product={JSON.parse(JSON.stringify(product))} />
    </>
  );
}
