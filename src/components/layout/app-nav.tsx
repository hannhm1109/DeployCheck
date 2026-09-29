"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Overview" },
  { href: "/projects", label: "Projects" },
  { href: "/releases", label: "Releases" },
  { href: "/deployments", label: "History" },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Main navigation" className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-start sm:gap-7">
      {links.map(({ href, label }) => {
        const active = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex h-11 items-center border-b-2 px-1 text-[13px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f7663] sm:h-[68px] ${active ? "border-[#0b7059] text-[#174c3d]" : "border-transparent text-[#607269] hover:text-[#174c3d]"}`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
