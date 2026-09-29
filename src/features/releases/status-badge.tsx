import { ReleaseStatus } from "@/generated/prisma/enums";

const statusDisplay: Record<ReleaseStatus, { label: string; className: string }> = {
  DRAFT: { label: "Draft", className: "bg-[#e8eeeb] text-[#54665c]" },
  IN_REVIEW: { label: "In review", className: "bg-[#fff0d6] text-[#865900]" },
  READY: { label: "Ready", className: "bg-[#d9f0e3] text-[#176143]" },
  DEPLOYING: { label: "Deploying", className: "bg-[#e0edfa] text-[#2e638e]" },
  DEPLOYED: { label: "Deployed", className: "bg-[#e0edfa] text-[#2e638e]" },
  FAILED: { label: "Failed", className: "bg-[#f9e2df] text-[#a3443c]" },
  ROLLED_BACK: { label: "Rolled back", className: "bg-[#f1e6ec] text-[#884b69]" },
};

export function ReleaseStatusBadge({ status }: { status: ReleaseStatus }) {
  const display = statusDisplay[status];
  return (
    <span
      className={`inline-flex min-h-6 items-center whitespace-nowrap rounded-[4px] px-2 py-0.5 text-xs font-medium ${display.className}`}
    >
      {display.label}
    </span>
  );
}
