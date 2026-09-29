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
      <body className="min-h-screen text-[#192822] antialiased">
        <header className="border-b border-[#dce5df] bg-white">
          <div className="mx-auto flex max-w-7xl flex-col px-5 sm:h-[68px] sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <Link
              href="/"
              className="inline-flex h-14 items-center gap-2.5 self-start text-[15px] font-bold text-[#172d27] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0f7663] sm:h-auto"
            >
              <span className="flex size-8 items-center justify-center rounded-[6px] bg-[#0b7059] text-white">
                <Blocks size={18} strokeWidth={2} aria-hidden="true" />
              </span>
              <span>DeployCheck</span>
              {isReadOnlyDemo() && <span className="ml-1 rounded-[4px] bg-[#edf2ef] px-2 py-1 text-[11px] font-medium text-[#52645b] lg:hidden">Read-only demo</span>}
            </Link>
            <div className="flex min-w-0 items-center gap-6">
              <AppNav />
              {isReadOnlyDemo() && <span className="hidden whitespace-nowrap border-l border-[#dce5df] pl-6 text-xs font-medium text-[#607269] lg:inline">Read-only demo</span>}
            </div>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
