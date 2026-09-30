"use client";

import { useActionState, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, Check, LoaderCircle, RotateCcw, X, XCircle } from "lucide-react";
import { ReleaseStatus } from "@/generated/prisma/enums";
import { getNextReleaseStatuses } from "@/lib/domain/releases/transitions";
import { transitionReleaseAction } from "@/server/actions/lifecycle";

const actionDisplay = {
  DRAFT: { key: "draft", icon: RotateCcw },
  IN_REVIEW: { key: "review", icon: ArrowRight },
  READY: { key: "ready", icon: Check },
  DEPLOYING: { key: "deploying", icon: ArrowRight },
  DEPLOYED: { key: "deployed", icon: Check },
  FAILED: { key: "failed", icon: XCircle },
  ROLLED_BACK: { key: "rolledBack", icon: RotateCcw },
};

const outcomeStatuses = new Set<ReleaseStatus>([
  ReleaseStatus.DEPLOYED,
  ReleaseStatus.FAILED,
  ReleaseStatus.ROLLED_BACK,
]);

function TransitionControl({
  releaseId,
  next,
  blocked,
}: {
  releaseId: string;
  next: ReleaseStatus;
  blocked: boolean;
}) {
  const locale = useLocale();
  const t = useTranslations("Lifecycle");
  const common = useTranslations("Common");
  const [expanded, setExpanded] = useState(false);
  const action = transitionReleaseAction.bind(null, releaseId, next);
  const [state, formAction, pending] = useActionState(action, {});
  const { key, icon: Icon } = actionDisplay[next];
  const label = t(key);
  const needsConfirmation = outcomeStatuses.has(next);

  return (
    <div>
      {needsConfirmation && !expanded ? (
        <button type="button" onClick={() => setExpanded(true)} className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-[6px] border border-[#cbd8d1] bg-white px-3 text-sm font-medium text-[#1c4033] hover:border-[#0d6b57] focus-visible:outline-2 focus-visible:outline-[#0d6b57]">
          <Icon size={16} aria-hidden="true" /> {label}
        </button>
      ) : (
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="locale" value={locale} />
          {needsConfirmation && (
            <>
              <label htmlFor={`notes-${next}`} className="block text-xs font-medium text-[#51665a]">{t("notes", { action: label })} <span className="font-normal text-[#809087]">{common("optional")}</span></label>
              <textarea id={`notes-${next}`} name="notes" rows={3} maxLength={1000} autoFocus className="block w-full resize-y rounded-[6px] border border-[#cbd8d1] bg-white px-3 py-2 text-sm text-[#1d2925] outline-none focus:border-[#0d6b57] focus:ring-2 focus:ring-[#c8e9db]" />
            </>
          )}
          <div className="flex gap-2">
            {needsConfirmation && <button type="button" onClick={() => setExpanded(false)} title={common("cancel")} aria-label={common("cancel")} className="inline-flex size-9 shrink-0 items-center justify-center rounded-[6px] border border-[#cbd8d1] text-[#60736a] hover:bg-[#e8eeeb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0d6b57]"><X size={16} aria-hidden="true" /></button>}
            <button type="submit" disabled={pending || blocked} title={blocked ? t("blockedTitle") : undefined} className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-[6px] border border-[#cbd8d1] bg-white px-3 text-sm font-medium text-[#1c4033] hover:border-[#0d6b57] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0d6b57] disabled:cursor-not-allowed disabled:opacity-50">
              {pending ? <LoaderCircle size={16} className="animate-spin" aria-hidden="true" /> : <Icon size={16} aria-hidden="true" />}
              {pending ? common("saving") : needsConfirmation ? t("confirm") : label}
            </button>
          </div>
        </form>
      )}
      {state.error && <p className="mt-2 text-xs leading-5 text-[#a13e3b]" role="alert">{state.error}</p>}
    </div>
  );
}

export function ReleaseLifecycle({
  releaseId,
  status,
  isReady,
}: {
  releaseId: string;
  status: ReleaseStatus;
  isReady: boolean;
}) {
  const t = useTranslations("Lifecycle");
  const nextStatuses = getNextReleaseStatuses(status);

  return (
    <section id="lifecycle" aria-labelledby="lifecycle-heading" className="scroll-mt-6 border-b border-[#d9e2dd] pb-6">
      <h2 id="lifecycle-heading" className="text-sm font-semibold text-[#263b31]">{t("title")}</h2>
      {nextStatuses.length === 0 ? (
        <p className="mt-4 text-sm text-[#64746e]">{t("noChanges")}</p>
      ) : (
        <div className="mt-4 space-y-3">
          {nextStatuses.map((next) => (
            <TransitionControl
              key={next}
              releaseId={releaseId}
              next={next}
              blocked={!isReady && (next === ReleaseStatus.READY || next === ReleaseStatus.DEPLOYING)}
            />
          ))}
          {!isReady && nextStatuses.some((next) => next === ReleaseStatus.READY || next === ReleaseStatus.DEPLOYING) && (
            <p className="text-xs leading-5 text-[#8a673c]">{t("blocked")}</p>
          )}
        </div>
      )}
    </section>
  );
}
