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
    default: "Vina - AI Tailored Job Application Letters & Founder Outreach",
    template: "%s - Vina",
  },
  description:
    "Vina turns job descriptions and your résumé into concise, high-converting outreach letters sent directly from your Gmail with 100% primary inbox deliverability, pre-send DNS MX verification, and the Gmail Safety Shield.",
  applicationName: "Vina",
  keywords: [
    "cold email for jobs",
    "personalized cold email for software engineers",
    "AI cover letter alternative",
    "founder outreach tool",
    "email hiring manager directly",
    "DNS MX email verification",
    "Gmail job application",
    "tailored cold outreach",
    "job application letter generator",
    "recruiter outreach tool",
    "meetvina",
    "meetvina.app",
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
    title: "Vina - AI Tailored Job Application Letters & Founder Outreach",
    description: "Vina turns job postings into tailored, human-toned outreach letters sent directly from your personal Gmail with 100% primary inbox deliverability.",
    url: "https://www.meetvina.app",
    siteName: "Vina",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Vina - Tailored Job Application Letters",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vina - AI Tailored Job Application Letters & Founder Outreach",
    description: "Turn job postings into tailored, human-toned outreach letters sent directly from your personal Gmail with 100% primary inbox deliverability.",
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

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      "@id": "https://www.meetvina.app/#webapp",
      "name": "Vina",
      "alternateName": "Vina AI Cold Email Sender",
      "url": "https://www.meetvina.app",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "All (Web Browser)",
      "description":
        "AI-powered tailored job outreach and executive correspondence platform. Analyzes job specifications, matches candidate résumé achievements, and dispatches high-converting letters directly from personal Gmail.",
      "browserRequirements": "Requires JavaScript. Requires HTML5.",
      "offers": [
        {
          "@type": "Offer",
          "name": "Free Tier",
          "price": "0",
          "priceCurrency": "USD",
          "description": "5 tailored letters per calendar month, 1 active résumé PDF, 2 AI regenerations per draft.",
        },
        {
          "@type": "Offer",
          "name": "Pro Membership",
          "price": "9",
          "priceCurrency": "USD",
          "description": "Unlimited tailored letters, 3 résumé versions, 1-click threaded follow-up letters, full lifetime archive.",
        },
      ],
      "featureList": [
        "Deep job description deconstruction",
        "Résumé proof-point synthesis",
        "Human conversational tone engine",
        "Pre-send DNS MX recipient verification",
        "Gmail Safety Shield (50 letters/24h ceiling)",
        "Native Gmail OAuth & authenticated SMTP dispatch",
        "Automated PDF résumé attachment",
        "1-click native threaded follow-ups",
      ],
    },
    {
      "@type": "FAQPage",
      "@id": "https://www.meetvina.app/#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "How does Vina write personalized cold emails for job applications?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text":
              "Vina analyzes the technical challenges in any job posting, maps your real résumé achievements to those requirements, and writes a concise, conversational note (80–130 words) free of generic corporate clichés.",
          },
        },
        {
          "@type": "Question",
          "name": "Will sending cold emails via Vina flag or ban my Gmail account?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text":
              "No. Vina is designed for high-touch 1-to-1 outreach, not mass marketing blasts. It includes the Gmail Safety Shield (a 50-letter daily ceiling) and pre-send DNS MX verification, keeping your activity well within Google's organic personal thresholds.",
          },
        },
        {
          "@type": "Question",
          "name": "Is Vina free to use?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text":
              "Yes, every user receives 5 free tailored letters every month. You can also upgrade to Vina Pro ($9/mo) for unlimited letters, multiple résumé versions, and one-click threaded follow-ups.",
          },
        },
      ],
    },
  ],
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
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
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
