import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ActivityDetailContent } from "@/components/public/activity-detail-content";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const activity = await prisma.activity.findFirst({
    where: { slug, isPublished: true },
    select: { title: true, content: true, coverImage: true },
  });

  if (!activity) return { title: "ไม่พบกิจกรรม" };

  const description =
    activity.content?.replace(/<[^>]*>/g, "").slice(0, 160) ||
    `${activity.title} - กิจกรรมจากศูนย์ร่มโพธิ์ร่มไทรวัยดอกลำดวน`;

  return {
    title: activity.title,
    description,
    openGraph: {
      title: activity.title,
      description,
      ...(activity.coverImage && {
        images: [{ url: activity.coverImage, alt: activity.title }],
      }),
    },
  };
}

export default async function ActivityDetailPage({ params }: Props) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);

  const activity = await prisma.activity.findFirst({
    where: { slug, isPublished: true },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!activity) notFound();

  return (
    <ActivityDetailContent activity={JSON.parse(JSON.stringify(activity))} />
  );
}
