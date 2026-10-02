import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Craft Letter",
  description: "Draft a short, specific letter to go with your résumé for any role.",
};

export default function DraftLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
