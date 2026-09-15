"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Header() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Draft" },
    { href: "/log", label: "Send Log" },
    { href: "/settings", label: "Settings & Resume" },
  ];

  return (
    <header className="border-b border-hairline bg-paper">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-heading text-xl text-ink tracking-tight hover:opacity-90 transition-opacity">
          Cold email
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`transition-colors ${
                  isActive
                    ? "font-medium text-ink underline underline-offset-8 decoration-hairline decoration-2"
                    : "text-muted-ink hover:text-ink"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
