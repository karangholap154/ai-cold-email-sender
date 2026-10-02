import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
  description: "Configure your active résumé, Gmail integration, and account details.",
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
