import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "fr"],
  defaultLocale: "en",
  localePrefix: "as-needed",
  localeDetection: false,
});

export type AppLocale = (typeof routing.locales)[number];

export function localePath(locale: AppLocale, path: string): string {
  return locale === "fr" ? `/fr${path === "/" ? "" : path}` : path;
}

export function parseLocale(value: unknown): AppLocale {
  return value === "fr" ? "fr" : "en";
}
