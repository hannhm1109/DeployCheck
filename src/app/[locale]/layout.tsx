import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { Blocks } from "lucide-react";
import { Suspense } from "react";
import { connection } from "next/server";
import { AppNav } from "@/components/layout/app-nav";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { WorkspaceSwitcher } from "@/components/layout/workspace-switcher";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getWorkspaceState } from "@/server/access";
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
  await connection();
  const [messages, t, authText, state] = await Promise.all([
    getMessages(), getTranslations({ locale, namespace: "Nav" }), getTranslations({ locale, namespace: "Auth" }), getWorkspaceState(),
  ]);
  const workspaces = state?.memberships.map((entry) => ({ id: entry.workspaceId, name: entry.workspace.name })) ?? [];

  return (
    <html lang={locale}>
      <body className="min-h-screen text-[#192822] antialiased">
        <NextIntlClientProvider messages={messages}>
          <header className="border-b border-[#dce5df] bg-white">
            <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center px-5 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:gap-7 lg:px-8">
              <Link href="/" className="inline-flex h-14 min-w-0 items-center gap-2.5 self-start text-[15px] font-bold text-[#172d27] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0f7663] lg:h-[68px]">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-[6px] bg-[#0b7059] text-white"><Blocks size={18} strokeWidth={2} aria-hidden="true" /></span>
                <span className="truncate">DeployCheck</span>
                {isReadOnlyDemo() && <span className="ml-2 hidden whitespace-nowrap rounded-[4px] bg-[#edf2ef] px-2 py-1 text-[11px] font-medium text-[#52645b] xl:inline">{t("readOnly")}</span>}
              </Link>
              {state?.workspace && <AppNav />}
              <div className="flex items-center justify-self-end gap-2">
                {state?.workspace && workspaces.length === 1 && <span className="hidden max-w-28 truncate text-xs font-medium text-[#42574c] lg:block" title={state.workspace.name}>{state.workspace.name}</span>}
                {state?.workspace && workspaces.length > 1 && <div className="hidden lg:block"><WorkspaceSwitcher workspaces={workspaces} activeId={state.workspace.id} /></div>}
                {state?.user ? <><span className="hidden max-w-24 truncate text-xs text-[#607269] xl:block" title={state.user.email}>{state.user.name}</span><SignOutButton /></> : <><Link href="/about" className="hidden text-xs font-medium text-[#607269] hover:text-[#0b7059] sm:inline">{t("about")}</Link><Link href="/sign-in" className="text-xs font-semibold text-[#0b7059] hover:underline">{authText("signIn")}</Link></>}
                <Suspense fallback={<span aria-hidden="true" className="h-8 w-[70px]" />}><LanguageSwitcher /></Suspense>
              </div>
              {state?.workspace && workspaces.length > 1 && <div className="order-2 col-span-2 pb-2 lg:hidden"><WorkspaceSwitcher workspaces={workspaces} activeId={state.workspace.id} /></div>}
            </div>
          </header>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
