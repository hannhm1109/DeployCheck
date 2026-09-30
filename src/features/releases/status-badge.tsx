import { ReleaseStatus } from "@/generated/prisma/enums";
import { useTranslations } from "next-intl";

const statusDisplay: Record<ReleaseStatus, { key: "draft" | "review" | "ready" | "deploying" | "deployed" | "failed" | "rolledBack"; className: string }> = {
  DRAFT: { key: "draft", className: "bg-[#e8eeeb] text-[#54665c]" },
  IN_REVIEW: { key: "review", className: "bg-[#fff0d6] text-[#865900]" },
  READY: { key: "ready", className: "bg-[#d9f0e3] text-[#176143]" },
  DEPLOYING: { key: "deploying", className: "bg-[#e0edfa] text-[#2e638e]" },
  DEPLOYED: { key: "deployed", className: "bg-[#e0edfa] text-[#2e638e]" },
  FAILED: { key: "failed", className: "bg-[#f9e2df] text-[#a3443c]" },
  ROLLED_BACK: { key: "rolledBack", className: "bg-[#f1e6ec] text-[#884b69]" },
};

export function ReleaseStatusBadge({ status }: { status: ReleaseStatus }) {
  const t = useTranslations("Status");
  const display = statusDisplay[status];
  return (
    <span
      className={`inline-flex min-h-6 items-center whitespace-nowrap rounded-[4px] px-2 py-0.5 text-xs font-medium ${display.className}`}
    >
      {t(display.key)}
    </span>
  );
}
