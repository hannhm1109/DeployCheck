"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

const links = [
  { href: "/", key: "overview" },
  { href: "/projects", key: "projects" },
  { href: "/releases", key: "releases" },
  { href: "/deployments", key: "history" },
  { href: "/about", key: "about" },
] as const;

export function AppNav() {
  const pathname = usePathname();
  const t = useTranslations("Nav");

  return (
    <nav aria-label={t("main")} className="order-3 col-span-2 flex w-full items-center gap-4 overflow-x-auto whitespace-nowrap sm:order-0 sm:col-span-1 sm:w-auto sm:justify-self-end sm:gap-6">
      {links.map(({ href, key }) => {
        const active = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex h-11 shrink-0 items-center border-b-2 px-1 text-[13px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f7663] sm:h-[68px] ${active ? "border-[#0b7059] text-[#174c3d]" : "border-transparent text-[#607269] hover:text-[#174c3d]"}`}
          >
            {t(key)}
          </Link>
        );
      })}
    </nav>
  );
}
