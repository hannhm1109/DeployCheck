import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { Blocks } from "lucide-react";
import { Suspense } from "react";
import { AppNav } from "@/components/layout/app-nav";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { isReadOnlyDemo } from "@/server/demo-access";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: "Meta" });
  return { title: "DeployCheck", description: t("description") };
}

export default async function RootLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const messages = await getMessages();
  const t = await getTranslations({ locale, namespace: "Nav" });

  return (
    <html lang={locale}>
      <body className="min-h-screen text-[#192822] antialiased">
        <NextIntlClientProvider messages={messages}>
          <header className="border-b border-[#dce5df] bg-white">
            <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center px-5 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:gap-7 sm:px-8">
            <Link
              href="/"
              className="inline-flex h-14 min-w-0 items-center gap-2.5 self-start text-[15px] font-bold text-[#172d27] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0f7663] sm:h-[68px]"
            >
              <span className="flex size-8 items-center justify-center rounded-[6px] bg-[#0b7059] text-white">
                <Blocks size={18} strokeWidth={2} aria-hidden="true" />
              </span>
              <span>DeployCheck</span>
              {isReadOnlyDemo() && <span className="ml-2 hidden whitespace-nowrap rounded-[4px] bg-[#edf2ef] px-2 py-1 text-[11px] font-medium text-[#52645b] lg:inline">{t("readOnly")}</span>}
            </Link>
            <AppNav />
              <Suspense fallback={<span aria-hidden="true" className="h-8 w-[70px]" />}>
                <LanguageSwitcher />
              </Suspense>
            </div>
          </header>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
