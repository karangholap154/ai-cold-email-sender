import type { Metadata } from "next";
import localFont from "next/font/local";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Header } from "@/components/header";
import "./globals.css";

const ibmPlexSans = localFont({
  src: "../public/fonts/ibm-plex-sans.woff2",
  variable: "--font-ibm-plex-sans",
  display: "swap",
  weight: "100 900",
});

const fraunces = localFont({
  src: "../public/fonts/fraunces.woff2",
  variable: "--font-fraunces",
  display: "swap",
  weight: "100 900",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://www.meetvina.app"),
  title: {
    default: "Vina — Tailored Job Application Letters",
    template: "%s — Vina",
  },
  description:
    "Vina reads the job description, drafts a short, specific letter to go with your résumé, and hands it back to you to review before anything is sent.",
  applicationName: "Vina",
  keywords: [
    "job application letter",
    "tailored cold email",
    "recruiter outreach",
    "cold email generator",
    "cover letter alternative",
    "Gmail job application",
    "meetvina",
  ],
  authors: [{ name: "Vina", url: "https://www.meetvina.app" }],
  creator: "Vina",
  alternates: {
    canonical: "./",
  },
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/logo.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/logo.png", sizes: "512x512", type: "image/png" }],
  },
  openGraph: {
    title: "Vina — meetvina.app",
    description: "Vina turns a job description into a letter worth sending.",
    url: "https://www.meetvina.app",
    siteName: "Vina",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Vina — meetvina.app",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vina — meetvina.app",
    description: "Turn a job description into a letter worth sending.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${ibmPlexSans.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        <TooltipProvider>
          <Header />
          {children}
          <Toaster theme="light" />
        </TooltipProvider>
      </body>
    </html>
  );
}
