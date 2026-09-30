"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { LoaderCircle, Save, X } from "lucide-react";
import { ReleaseItemStatus, ReleaseItemType } from "@/generated/prisma/enums";
import type { ReleaseItemFormState, ReleaseItemFormValues } from "@/lib/validation/release-items";
import { addReleaseItemAction, editReleaseItemAction } from "@/server/actions/release-items";

const inputClassName =
  "mt-1.5 block h-10 w-full rounded-[6px] border border-[#cbd8d1] bg-white px-3 text-sm text-[#1d2925] outline-none focus:border-[#0d6b57] focus:ring-2 focus:ring-[#c8e9db] aria-invalid:border-[#c44d4d]";

const typeOptions = [
  { value: ReleaseItemType.FEATURE, key: "feature" },
  { value: ReleaseItemType.BUG, key: "bug" },
  { value: ReleaseItemType.HOTFIX, key: "hotfix" },
  { value: ReleaseItemType.INFRASTRUCTURE, key: "infrastructure" },
  { value: ReleaseItemType.TECHNICAL, key: "technical" },
] as const;

const statusOptions = [
  { value: ReleaseItemStatus.TODO, key: "todo" },
  { value: ReleaseItemStatus.IN_PROGRESS, key: "inProgress" },
  { value: ReleaseItemStatus.QA_PENDING, key: "qaPending" },
  { value: ReleaseItemStatus.READY, key: "ready" },
] as const;

export function ItemForm({
  releaseId,
  item,
  onCancel,
}: {
  releaseId: string;
  item?: { id: string } & ReleaseItemFormValues;
  onCancel: () => void;
}) {
  const locale = useLocale();
  const t = useTranslations("Items");
  const common = useTranslations("Common");
  const forms = useTranslations("Forms");
  const initialState: ReleaseItemFormState = {
    values: item ?? {
      externalReference: "",
      title: "",
      type: ReleaseItemType.FEATURE,
      status: ReleaseItemStatus.TODO,
      notes: "",
    },
    errors: {},
  };
  const action = item
    ? editReleaseItemAction.bind(null, releaseId, item.id)
    : addReleaseItemAction.bind(null, releaseId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const prefix = item?.id ?? "new-item";

  function errorFor(field: keyof ReleaseItemFormValues) {
    return state.errors[field] ? (
      <p id={`${prefix}-${field}-error`} className="mt-1.5 text-xs text-[#a13e3b]" role="alert">
        {state.errors[field]}
      </p>
    ) : null;
  }

  return (
    <form action={formAction} noValidate className="border-y border-[#d9e2dd] bg-white px-4 py-5 sm:px-5">
      <input type="hidden" name="locale" value={locale} />
      <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${prefix}-reference`} className="text-sm font-semibold text-[#243930]">{t("reference")}</label>
          <input id={`${prefix}-reference`} name="externalReference" type="text" autoComplete="off" maxLength={40} defaultValue={state.values.externalReference} aria-invalid={Boolean(state.errors.externalReference)} aria-describedby={state.errors.externalReference ? `${prefix}-externalReference-error` : undefined} placeholder="KAR-321" className={`${inputClassName} font-mono uppercase`} />
          {errorFor("externalReference")}
        </div>
        <div>
          <label htmlFor={`${prefix}-title`} className="text-sm font-semibold text-[#243930]">{t("formTitle")}</label>
          <input id={`${prefix}-title`} name="title" type="text" autoComplete="off" maxLength={160} defaultValue={state.values.title} aria-invalid={Boolean(state.errors.title)} aria-describedby={state.errors.title ? `${prefix}-title-error` : undefined} placeholder={forms("itemTitlePlaceholder")} className={inputClassName} />
          {errorFor("title")}
        </div>
        <div>
          <label htmlFor={`${prefix}-type`} className="text-sm font-semibold text-[#243930]">{t("type")}</label>
          <select id={`${prefix}-type`} name="type" defaultValue={state.values.type} aria-invalid={Boolean(state.errors.type)} aria-describedby={state.errors.type ? `${prefix}-type-error` : undefined} className={inputClassName}>
            {typeOptions.map((option) => <option key={option.value} value={option.value}>{t(option.key)}</option>)}
          </select>
          {errorFor("type")}
        </div>
        <div>
          <label htmlFor={`${prefix}-status`} className="text-sm font-semibold text-[#243930]">{t("readinessStatus")}</label>
          <select id={`${prefix}-status`} name="status" defaultValue={state.values.status} aria-invalid={Boolean(state.errors.status)} aria-describedby={state.errors.status ? `${prefix}-status-error` : undefined} className={inputClassName}>
            {statusOptions.map((option) => <option key={option.value} value={option.value}>{t(option.key)}</option>)}
          </select>
          {errorFor("status")}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={`${prefix}-notes`} className="text-sm font-semibold text-[#243930]">{t("notes")} <span className="font-normal text-[#64746e]">{common("optional")}</span></label>
          <textarea id={`${prefix}-notes`} name="notes" rows={3} maxLength={1000} defaultValue={state.values.notes} aria-invalid={Boolean(state.errors.notes)} aria-describedby={state.errors.notes ? `${prefix}-notes-error` : undefined} className="mt-1.5 block w-full resize-y rounded-[6px] border border-[#cbd8d1] bg-white px-3 py-2 text-sm text-[#1d2925] outline-none focus:border-[#0d6b57] focus:ring-2 focus:ring-[#c8e9db] aria-invalid:border-[#c44d4d]" />
          {errorFor("notes")}
        </div>
      </div>
      {state.message && <p className="mt-4 text-sm text-[#a13e3b]" role="alert">{state.message}</p>}
      <div className="mt-5 flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="inline-flex h-9 items-center gap-1.5 px-2 text-sm font-medium text-[#5b6c63] hover:text-[#1d2925] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0d6b57]"><X size={15} aria-hidden="true" /> {common("cancel")}</button>
        <button type="submit" disabled={pending} className="inline-flex h-9 min-w-27 items-center justify-center gap-1.5 rounded-[6px] bg-[#0d6b57] px-3 text-sm font-medium text-white hover:bg-[#095442] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0d6b57] disabled:cursor-wait disabled:opacity-65">
          {pending ? <LoaderCircle size={15} className="animate-spin" aria-hidden="true" /> : <Save size={15} aria-hidden="true" />}
          {pending ? common("saving") : item ? t("save") : t("add")}
        </button>
      </div>
    </form>
  );
}
