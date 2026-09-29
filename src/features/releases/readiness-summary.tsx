import { AlertCircle, CheckCircle2 } from "lucide-react";
import type { calculateReleaseReadiness } from "@/lib/domain/releases/readiness";

type Readiness = ReturnType<typeof calculateReleaseReadiness>;

function blockerTarget(code: Readiness["blockers"][number]["code"]): string {
  if (code === "ITEM_NOT_READY") return "#tickets";
  if (code === "ROLLBACK_PLAN_MISSING") return "#rollback";
  return "#checklist";
}

export function ReadinessSummary({ readiness }: { readiness: Readiness }) {
  return (
    <section aria-labelledby="readiness-heading" className="border-b border-[#d9e2dd] py-7">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="flex items-start gap-3">
          {readiness.isReady ? (
            <CheckCircle2 size={22} className="mt-0.5 shrink-0 text-[#176143]" aria-hidden="true" />
          ) : (
            <AlertCircle size={22} className="mt-0.5 shrink-0 text-[#a15a17]" aria-hidden="true" />
          )}
          <div>
            <h2 id="readiness-heading" className="text-lg font-semibold text-[#1b3029]">
              {readiness.isReady ? "Readiness criteria met" : "Release not ready"}
            </h2>
            <p className="mt-1 text-sm text-[#64746e]">
              {readiness.completedChecks}/{readiness.totalChecks} checks completed
              <span className="mx-2 text-[#a6b5ac]" aria-hidden="true">|</span>
              {readiness.readyItems}/{readiness.totalItems} tickets ready
            </p>
          </div>
        </div>
      </div>
      {readiness.blockers.length > 0 && (
        <div className="mt-6 pl-9">
          <h3 className="text-xs font-semibold uppercase text-[#64746e]">Blockers</h3>
          <ul className="mt-2 grid gap-x-8 gap-y-2 sm:grid-cols-2">
            {readiness.blockers.map((blocker, index) => (
              <li key={`${blocker.code}-${index}`} className="text-sm leading-5 text-[#4e6157]">
                <a href={blockerTarget(blocker.code)} className="underline decoration-[#c8d6cd] underline-offset-3 hover:text-[#0d6b57] hover:decoration-[#0d6b57]">
                  {blocker.message}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
