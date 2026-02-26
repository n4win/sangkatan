import { prisma } from "@/lib/prisma";
import { HomeContent } from "@/components/public/home-content";

export const metadata = {
  title: "หน้าแรก",
  description:
    "สังฆทานออนไลน์ ศูนย์ร่มโพธิ์ร่มไทรวัยดอกลำดวน จำหน่ายชุดสังฆทานคุณภาพ สินค้าผลิตภัณฑ์ และกิจกรรมทางศาสนา",
};

export default async function HomePage() {
  const [banners, featuredProducts, latestActivities] = await Promise.all([
    prisma.banner.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      include: {
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
        category: { select: { name: true } },
      },
      take: 8,
      orderBy: { createdAt: "desc" },
    }),
    prisma.activity.findMany({
      where: { isPublished: true },
      select: {
        id: true,
        title: true,
        content: true,
        coverImage: true,
        slug: true,
        publishedAt: true,
        _count: { select: { images: true } },
      },
      take: 4,
      orderBy: { publishedAt: "desc" },
    }),
  ]);

  const serialized = {
    banners: JSON.parse(JSON.stringify(banners)),
    featuredProducts: JSON.parse(JSON.stringify(featuredProducts)),
    latestActivities: JSON.parse(JSON.stringify(latestActivities)),
  };

  return <HomeContent {...serialized} />;
}
