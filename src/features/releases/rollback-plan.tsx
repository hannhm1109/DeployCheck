"use client";

import { useActionState, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { LoaderCircle, Pencil, Save, X } from "lucide-react";
import type { RollbackFormState } from "@/lib/validation/checklist";
import { saveRollbackPlanAction } from "@/server/actions/checklist";

function RollbackEditor({ releaseId, notes, onCancel }: { releaseId: string; notes: string | null; onCancel: () => void }) {
  const locale = useLocale();
  const t = useTranslations("Rollback");
  const common = useTranslations("Common");
  const initialState: RollbackFormState = { value: notes ?? "" };
  const action = saveRollbackPlanAction.bind(null, releaseId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} noValidate className="mt-4">
      <input type="hidden" name="locale" value={locale} />
      <label htmlFor="rollbackNotes" className="sr-only">{t("title")}</label>
      <textarea id="rollbackNotes" name="rollbackNotes" rows={5} maxLength={2000} defaultValue={state.value} aria-invalid={Boolean(state.error)} aria-describedby={state.error ? "rollback-error" : undefined} className="block w-full resize-y rounded-[6px] border border-[#cbd8d1] bg-white px-3 py-2 text-sm text-[#1d2925] outline-none focus:border-[#0d6b57] focus:ring-2 focus:ring-[#c8e9db]" />
      {state.error && <p id="rollback-error" className="mt-2 text-sm text-[#a13e3b]" role="alert">{state.error}</p>}
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

export function RollbackPlan({ releaseId, notes, editable }: { releaseId: string; notes: string | null; editable: boolean }) {
  const t = useTranslations("Rollback");
  const [editing, setEditing] = useState(false);

  return (
    <section id="rollback" aria-labelledby="rollback-heading" className="scroll-mt-6 border-t border-[#e2e9e5] pt-8">
      <div className="flex items-center justify-between gap-4">
        <h2 id="rollback-heading" className="text-lg font-semibold text-[#1b3029]">{t("title")}</h2>
        {editable && <button type="button" onClick={() => setEditing((value) => !value)} title={t("edit")} aria-label={t("edit")} aria-expanded={editing} className="inline-flex size-8 items-center justify-center rounded-[4px] text-[#697a70] hover:bg-[#e8eeeb] hover:text-[#164d40] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0d6b57]"><Pencil size={16} aria-hidden="true" /></button>}
      </div>
      {editing ? <RollbackEditor releaseId={releaseId} notes={notes} onCancel={() => setEditing(false)} /> : <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-[#4e6157]">{notes || t("empty")}</p>}
    </section>
  );
}
