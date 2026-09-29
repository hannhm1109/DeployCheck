import type { Metadata } from "next";
import Link from "next/link";
import { Blocks } from "lucide-react";
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
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
            <Link
              href="/projects"
              className="inline-flex items-center gap-3 font-semibold text-[#172d27] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0f7663]"
            >
              <span className="flex size-8 items-center justify-center rounded-[6px] bg-[#0d6b57] text-white">
                <Blocks size={18} strokeWidth={2} aria-hidden="true" />
              </span>
              <span>DeployCheck</span>
            </Link>
            <nav aria-label="Main navigation">
              <Link
                href="/projects"
                aria-current="page"
                className="inline-flex h-10 items-center border-b-2 border-[#0d6b57] px-2 text-sm font-medium text-[#164d40] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f7663]"
              >
                Projects
              </Link>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
