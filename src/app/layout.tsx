import type { Metadata } from "next";
import Link from "next/link";
import { Blocks } from "lucide-react";
import { AppNav } from "@/components/layout/app-nav";
import { isReadOnlyDemo } from "@/server/demo-access";
import "./globals.css";

export const metadata: Metadata = {
  title: "DeployCheck",
  description: "Release readiness and deployment tracking for small software teams.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#f7f9f8] text-[#1d2925] antialiased">
        <header className="border-b border-[#dce5e0] bg-white">
          <div className="mx-auto flex max-w-6xl flex-col px-5 sm:h-16 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <Link
              href="/"
              className="inline-flex h-14 items-center gap-3 self-start font-semibold text-[#172d27] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0f7663] sm:h-auto"
            >
              <span className="flex size-8 items-center justify-center rounded-[6px] bg-[#0d6b57] text-white">
                <Blocks size={18} strokeWidth={2} aria-hidden="true" />
              </span>
              <span>DeployCheck</span>
              {isReadOnlyDemo() && <span className="rounded-[4px] bg-[#e8eeeb] px-2 py-1 text-xs font-medium text-[#40544b]">Read-only demo</span>}
            </Link>
            <AppNav />
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
