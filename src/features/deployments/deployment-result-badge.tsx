import { DeploymentResult } from "@/generated/prisma/enums";
import { useTranslations } from "next-intl";

const display: Record<DeploymentResult, { key: "succeeded" | "failed" | "rolledBack"; className: string }> = {
  SUCCEEDED: { key: "succeeded", className: "bg-[#d9f0e3] text-[#176143]" },
  FAILED: { key: "failed", className: "bg-[#f9e2df] text-[#a3443c]" },
  ROLLED_BACK: { key: "rolledBack", className: "bg-[#f1e6ec] text-[#884b69]" },
};

export function DeploymentResultBadge({ result }: { result: DeploymentResult }) {
  const t = useTranslations("Status");
  const { key, className } = display[result];
  return <span className={`inline-flex min-h-6 items-center whitespace-nowrap rounded-[4px] px-2 py-0.5 text-xs font-medium ${className}`}>{t(key)}</span>;
}
