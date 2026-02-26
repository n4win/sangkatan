export function OrganizationJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "ศูนย์ร่มโพธิ์ร่มไทรวัยดอกลำดวน",
    description:
      "สังฆทานออนไลน์ จำหน่ายชุดสังฆทานคุณภาพ ถูกต้องตามหลักพระพุทธศาสนา พร้อมจัดส่งทั่วประเทศ",
    url: process.env.AUTH_URL || "http://localhost:3000",
    logo: `${process.env.AUTH_URL || "http://localhost:3000"}/icon/logo.png`,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

interface ProductJsonLdProps {
  name: string;
  description?: string | null;
  price: string | number;
  image?: string | null;
  slug: string;
  reviewCount?: number;
  ratingValue?: number;
}

export function ProductJsonLd({
  name,
  description,
  price,
  image,
  slug,
  reviewCount,
  ratingValue,
}: ProductJsonLdProps) {
  const baseUrl = process.env.AUTH_URL || "http://localhost:3000";

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description: description || name,
    url: `${baseUrl}/products/${encodeURIComponent(slug)}`,
    ...(image && { image }),
    offers: {
      "@type": "Offer",
      priceCurrency: "THB",
      price: String(price),
      availability: "https://schema.org/InStock",
    },
  };

  if (reviewCount && reviewCount > 0 && ratingValue) {
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: String(ratingValue),
      reviewCount: String(reviewCount),
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

interface BreadcrumbItem {
  name: string;
  href: string;
}

export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  const baseUrl = process.env.AUTH_URL || "http://localhost:3000";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${baseUrl}${item.href}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
