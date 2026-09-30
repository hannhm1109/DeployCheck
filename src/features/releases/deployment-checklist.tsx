"use client";

import { useActionState, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Circle, CircleCheck, LoaderCircle, Pencil, Save, X } from "lucide-react";
import { ChecklistKind } from "@/generated/prisma/enums";
import { REQUIRED_CHECKS, requiresChangeDecision } from "@/lib/domain/releases/readiness";
import { checkKeys } from "@/i18n/labels";
import type { ChecklistFormState } from "@/lib/validation/checklist";
import { saveChecklistItemAction } from "@/server/actions/checklist";

type Check = {
  kind: ChecklistKind;
  isComplete: boolean;
  changeRequired: boolean | null;
  notes: string | null;
};

function ChecklistRowForm({
  releaseId,
  kind,
  check,
  onCancel,
}: {
  releaseId: string;
  kind: ChecklistKind;
  check?: Check;
  onCancel: () => void;
}) {
  const locale = useLocale();
  const t = useTranslations("Checks");
  const common = useTranslations("Common");
  const initialState: ChecklistFormState = {
    values: {
      isComplete: check?.isComplete ?? false,
      changeRequired: check?.changeRequired === null || check?.changeRequired === undefined
        ? ""
        : check.changeRequired ? "true" : "false",
      notes: check?.notes ?? "",
    },
    errors: {},
  };
  const action = saveChecklistItemAction.bind(null, releaseId, kind);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} noValidate className="border-t border-[#e2e9e5] bg-white px-3 py-4 sm:px-4">
      <input type="hidden" name="locale" value={locale} />
      <label className="inline-flex items-center gap-2 text-sm font-medium text-[#243930]">
        <input type="checkbox" name="isComplete" value="true" defaultChecked={state.values.isComplete} aria-invalid={Boolean(state.errors.isComplete)} aria-describedby={state.errors.isComplete ? `${kind}-complete-error` : undefined} className="size-4 accent-[#0d6b57]" />
        {t("completed")}
      </label>
      {state.errors.isComplete && <p id={`${kind}-complete-error`} className="mt-1 text-xs text-[#a13e3b]" role="alert">{state.errors.isComplete}</p>}
      {requiresChangeDecision(kind) && (
        <div className="mt-4">
          <label htmlFor={`${kind}-decision`} className="block text-sm font-medium text-[#243930]">{t("changeRequired")}</label>
          <select id={`${kind}-decision`} name="changeRequired" defaultValue={state.values.changeRequired} aria-invalid={Boolean(state.errors.changeRequired)} aria-describedby={state.errors.changeRequired ? `${kind}-decision-error` : undefined} className="mt-1.5 h-10 w-full rounded-[6px] border border-[#cbd8d1] bg-white px-3 text-sm text-[#1d2925] outline-none focus:border-[#0d6b57] focus:ring-2 focus:ring-[#c8e9db] sm:max-w-60">
            <option value="">{t("notDecided")}</option>
            <option value="true">{t("yes")}</option>
            <option value="false">{t("no")}</option>
          </select>
          {state.errors.changeRequired && <p id={`${kind}-decision-error`} className="mt-1 text-xs text-[#a13e3b]" role="alert">{state.errors.changeRequired}</p>}
        </div>
      )}
      <div className="mt-4">
        <label htmlFor={`${kind}-notes`} className="block text-sm font-medium text-[#243930]">{t("notes")} <span className="font-normal text-[#64746e]">{common("optional")}</span></label>
        <textarea id={`${kind}-notes`} name="notes" rows={3} maxLength={1000} defaultValue={state.values.notes} aria-invalid={Boolean(state.errors.notes)} aria-describedby={state.errors.notes ? `${kind}-notes-error` : undefined} className="mt-1.5 block w-full resize-y rounded-[6px] border border-[#cbd8d1] bg-white px-3 py-2 text-sm text-[#1d2925] outline-none focus:border-[#0d6b57] focus:ring-2 focus:ring-[#c8e9db]" />
        {state.errors.notes && <p id={`${kind}-notes-error`} className="mt-1 text-xs text-[#a13e3b]" role="alert">{state.errors.notes}</p>}
      </div>
      {state.message && <p className="mt-3 text-sm text-[#a13e3b]" role="alert">{state.message}</p>}
      <div className="mt-4 flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="inline-flex h-9 items-center gap-1.5 px-2 text-sm font-medium text-[#5b6c63] hover:text-[#1d2925] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0d6b57]"><X size={15} aria-hidden="true" /> {common("cancel")}</button>
        <button type="submit" disabled={pending} className="inline-flex h-9 min-w-27 items-center justify-center gap-1.5 rounded-[6px] bg-[#0d6b57] px-3 text-sm font-medium text-white hover:bg-[#095442] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0d6b57] disabled:cursor-wait disabled:opacity-65">
          {pending ? <LoaderCircle size={15} className="animate-spin" aria-hidden="true" /> : <Save size={15} aria-hidden="true" />}
          {pending ? common("saving") : t("save")}
        </button>
      </div>
    </form>
  );
}

export function DeploymentChecklist({
  releaseId,
  checks,
  editable,
  completedChecks,
}: {
  releaseId: string;
  checks: Check[];
  editable: boolean;
  completedChecks: number;
}) {
  const t = useTranslations("Checks");
  const [editing, setEditing] = useState<ChecklistKind | null>(null);
  const byKind = new Map(checks.map((check) => [check.kind, check]));

  return (
    <section id="checklist" aria-labelledby="checklist-heading" className="scroll-mt-6 border-t border-[#e2e9e5] pt-8">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="checklist-heading" className="text-lg font-semibold text-[#1b3029]">{t("title")}</h2>
        <span className="text-sm tabular-nums text-[#64746e]">{completedChecks}/{REQUIRED_CHECKS.length}</span>
      </div>
      <ul className="mt-5 divide-y divide-[#e2e9e5] border-y border-[#d9e2dd]">
        {REQUIRED_CHECKS.map((kind) => {
          const check = byKind.get(kind);
          return (
            <li key={kind}>
              <div className="flex items-start justify-between gap-4 py-4">
                <div className="flex min-w-0 items-start gap-3">
                  {check?.isComplete ? <CircleCheck size={18} className="mt-0.5 shrink-0 text-[#176143]" aria-hidden="true" /> : <Circle size={18} className="mt-0.5 shrink-0 text-[#9aaa9f]" aria-hidden="true" />}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#263b31]">{t(checkKeys[kind])}</p>
                    <p className="mt-1 text-xs text-[#64746e]">
                      {!check ? t("missing") : check.isComplete ? t("complete") : t("incomplete")}
                      {requiresChangeDecision(kind) && ` | ${t("changeRequired")}: ${check?.changeRequired === null || check?.changeRequired === undefined ? t("notDecided") : check.changeRequired ? t("yes") : t("no")}`}
                    </p>
                    {check?.notes && <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-5 text-[#60736a]">{check.notes}</p>}
                  </div>
                </div>
                {editable && (
                  <button type="button" onClick={() => setEditing((current) => current === kind ? null : kind)} title={t("edit", { check: t(checkKeys[kind]) })} aria-label={t("edit", { check: t(checkKeys[kind]) })} aria-expanded={editing === kind} className="inline-flex size-8 shrink-0 items-center justify-center rounded-[4px] text-[#697a70] hover:bg-[#e8eeeb] hover:text-[#164d40] focus-visible:outline-2 focus-visible:outline-[#0d6b57]"><Pencil size={16} aria-hidden="true" /></button>
                )}
              </div>
              {editing === kind && <ChecklistRowForm releaseId={releaseId} kind={kind} check={check} onCancel={() => setEditing(null)} />}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
