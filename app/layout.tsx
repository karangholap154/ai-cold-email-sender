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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://meetvina.com"),
  title: "Vina — meetvina.com",
  description:
    "Vina reads the job description, drafts a short, specific letter to go with your résumé, and hands it back to you to review before anything is sent.",
  openGraph: {
    title: "Vina — meetvina.com",
    description: "Vina turns a job description into a letter worth sending.",
    url: "https://meetvina.com",
    siteName: "Vina",
    type: "website",
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
