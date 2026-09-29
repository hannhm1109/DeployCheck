import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DeployCheck",
  description: "Release readiness and deployment tracking for small software teams.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
