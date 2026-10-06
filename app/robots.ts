import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://www.meetvina.app").replace(/\/+$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
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
