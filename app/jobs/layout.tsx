import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Opportunities — Live Aligned Jobs",
  description: "Browse live, active job postings with direct founder and recruiter outreach or official application portals.",
};

export default function JobsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
