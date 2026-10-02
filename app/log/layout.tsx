import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sent Letters",
  description: "View and manage sent tailored letters, follow-ups, and correspondence history.",
};

export default function LogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
