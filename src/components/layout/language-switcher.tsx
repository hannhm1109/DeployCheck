"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";

export function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations("Nav");
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function change(next: AppLocale) {
    if (next === locale) return;
    const query = searchParams.toString();
    startTransition(() => router.replace(`${pathname}${query ? `?${query}` : ""}`, { locale: next }));
  }

  return (
    <div role="group" aria-label={t("language")} className="flex h-8 items-center rounded-[5px] border border-[#dce5df] bg-[#f6f8f7] p-0.5">
      {(["en", "fr"] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => change(option)}
          disabled={pending}
          aria-pressed={locale === option}
          lang={option}
          className={`h-6 min-w-8 rounded-[3px] px-1 text-[11px] font-bold transition-colors focus-visible:outline-2 focus-visible:outline-[#0b7059] disabled:opacity-60 ${locale === option ? "bg-white text-[#174c3d] shadow-sm" : "text-[#607269] hover:text-[#174c3d]"}`}
        >
          {option.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
