import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Vina — Tailored Job Application Letters",
    short_name: "Vina",
    description:
      "Vina turns a job description into a tailored letter worth sending, delivered from your own Gmail account with your résumé attached.",
    start_url: "/",
    display: "standalone",
    background_color: "#F6F5F1",
    theme_color: "#F6F5F1",
    icons: [
      {
        src: "/favicon.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/logo-1024.png",
        sizes: "1024x1024",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
