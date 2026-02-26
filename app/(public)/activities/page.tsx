import { prisma } from "@/lib/prisma";
import { ActivitiesListContent } from "@/components/public/activities-list-content";

export const metadata = {
  title: "กิจกรรม",
  description:
    "กิจกรรมทางศาสนาและกิจกรรมเพื่อสังคม จัดโดยศูนย์ร่มโพธิ์ร่มไทรวัยดอกลำดวน ติดตามข่าวสารและร่วมกิจกรรมกับเรา",
};

export default async function ActivitiesPage() {
  const activities = await prisma.activity.findMany({
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
    orderBy: { publishedAt: "desc" },
  });

  return (
    <ActivitiesListContent
      activities={JSON.parse(JSON.stringify(activities))}
    />
  );
}
