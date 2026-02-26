import { prisma } from "@/lib/prisma";
import { ProductsListContent } from "@/components/public/products-list-content";

export const metadata = {
  title: "สินค้า",
  description:
    "เลือกซื้อชุดสังฆทานและสินค้าผลิตภัณฑ์คุณภาพ จากศูนย์ร่มโพธิ์ร่มไทรวัยดอกลำดวน หลากหลายรายการ พร้อมจัดส่งทั่วประเทศ",
};

export default async function ProductsPage() {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      include: {
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
        category: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <ProductsListContent
      products={JSON.parse(JSON.stringify(products))}
      categories={JSON.parse(JSON.stringify(categories))}
    />
  );
}
