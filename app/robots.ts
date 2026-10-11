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
          "/llms.txt",
          "/llms-full.txt",
        ],
        disallow: [
          "/draft",
          "/log",
          "/settings",
          "/api/",
          "/auth/",
        ],
      },
      {
        userAgent: [
          "GPTBot",
          "ChatGPT-User",
          "ClaudeBot",
          "PerplexityBot",
          "Google-Extended",
          "Applebot-Extended",
          "Amazonbot",
          "cohere-ai",
        ],
        allow: [
          "/",
          "/privacy",
          "/terms",
          "/refund",
          "/contact",
          "/llms.txt",
          "/llms-full.txt",
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
