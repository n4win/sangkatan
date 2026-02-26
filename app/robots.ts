import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.AUTH_URL || "http://localhost:3000";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/cart", "/orders", "/profile", "/signin"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
