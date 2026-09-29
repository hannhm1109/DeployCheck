"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/projects", label: "Projects" },
  { href: "/releases", label: "Releases" },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Main navigation" className="flex items-center gap-3 sm:gap-5">
      {links.map(({ href, label }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex h-10 items-center border-b-2 px-1 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f7663] ${active ? "border-[#0d6b57] text-[#164d40]" : "border-transparent text-[#64746e] hover:text-[#164d40]"}`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
