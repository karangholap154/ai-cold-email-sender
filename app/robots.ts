import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://meetvina.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/signup",
          "/login",
          "/privacy",
          "/terms",
          "/refund",
          "/contact",
          "/opengraph-image",
          "/favicon.ico",
        ],
        disallow: [
          "/draft",
          "/log",
          "/settings",
          "/api/",
          "/auth/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
