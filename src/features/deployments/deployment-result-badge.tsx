import { DeploymentResult } from "@/generated/prisma/enums";

const display: Record<DeploymentResult, { label: string; className: string }> = {
  SUCCEEDED: { label: "Succeeded", className: "bg-[#d9f0e3] text-[#176143]" },
  FAILED: { label: "Failed", className: "bg-[#f9e2df] text-[#a3443c]" },
  ROLLED_BACK: { label: "Rolled back", className: "bg-[#f1e6ec] text-[#884b69]" },
};

export function DeploymentResultBadge({ result }: { result: DeploymentResult }) {
  const { label, className } = display[result];
  return <span className={`inline-flex min-h-6 items-center whitespace-nowrap rounded-[4px] px-2 py-0.5 text-xs font-medium ${className}`}>{label}</span>;
}
