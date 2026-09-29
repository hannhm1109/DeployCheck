import { AlertCircle, CheckCircle2 } from "lucide-react";
import type { calculateReleaseReadiness } from "@/lib/domain/releases/readiness";

type Readiness = ReturnType<typeof calculateReleaseReadiness>;

function blockerTarget(code: Readiness["blockers"][number]["code"]): string {
  if (code === "ITEM_NOT_READY") return "#tickets";
  if (code === "ROLLBACK_PLAN_MISSING") return "#rollback";
  return "#checklist";
}

export function ReadinessSummary({ readiness }: { readiness: Readiness }) {
  const checkProgress = Math.round((readiness.completedChecks / readiness.totalChecks) * 100);
  const ticketProgress = readiness.totalItems ? Math.round((readiness.readyItems / readiness.totalItems) * 100) : 0;

  return (
    <section aria-labelledby="readiness-heading" className="border-y border-[#dce5df] bg-white px-5 py-6 sm:px-7">
      <div className="flex flex-wrap items-start gap-3">
          {readiness.isReady ? (
            <CheckCircle2 size={22} className="mt-0.5 shrink-0 text-[#176143]" aria-hidden="true" />
          ) : (
            <AlertCircle size={22} className="mt-0.5 shrink-0 text-[#a15a17]" aria-hidden="true" />
          )}
          <div>
            <h2 id="readiness-heading" className="text-lg font-semibold text-[#192822]">
              {readiness.isReady ? "Readiness criteria met" : "Release not ready"}
            </h2>
          </div>
      </div>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 sm:gap-8">
        <div>
          <p className="flex justify-between gap-3 text-xs font-semibold text-[#42574c]"><span>Checks completed</span><span className="tabular-nums">{readiness.completedChecks}/{readiness.totalChecks}</span></p>
          <div className="mt-2 h-1.5 bg-[#e5ebe7]"><div className="h-full bg-[#0b7059]" style={{ width: `${checkProgress}%` }} /></div>
        </div>
        <div>
          <p className="flex justify-between gap-3 text-xs font-semibold text-[#42574c]"><span>Tickets ready</span><span className="tabular-nums">{readiness.readyItems}/{readiness.totalItems}</span></p>
          <div className="mt-2 h-1.5 bg-[#e5ebe7]"><div className="h-full bg-[#2f657c]" style={{ width: `${ticketProgress}%` }} /></div>
        </div>
      </div>
      {readiness.blockers.length > 0 && (
        <div className="mt-6 border-t border-[#e5ebe7] pt-5">
          <h3 className="text-xs font-semibold uppercase text-[#607269]">Blockers <span className="ml-1 tabular-nums">{readiness.blockers.length}</span></h3>
          <ul className="mt-2 grid gap-x-8 gap-y-2 sm:grid-cols-2">
            {readiness.blockers.map((blocker, index) => (
              <li key={`${blocker.code}-${index}`} className="text-sm leading-5 text-[#4e6157]">
                <a href={blockerTarget(blocker.code)} className="underline decoration-[#c8d6cd] underline-offset-3 hover:text-[#0b7059] hover:decoration-[#0b7059]">
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
