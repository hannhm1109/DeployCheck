"use client";

import { useActionState } from "react";
import { LoaderCircle, Save, X } from "lucide-react";
import { ReleaseItemStatus, ReleaseItemType } from "@/generated/prisma/enums";
import type { ReleaseItemFormState, ReleaseItemFormValues } from "@/lib/validation/release-items";
import { addReleaseItemAction, editReleaseItemAction } from "@/server/actions/release-items";

const inputClassName =
  "mt-1.5 block h-10 w-full rounded-[6px] border border-[#cbd8d1] bg-white px-3 text-sm text-[#1d2925] outline-none focus:border-[#0d6b57] focus:ring-2 focus:ring-[#c8e9db] aria-invalid:border-[#c44d4d]";

const typeOptions: { value: ReleaseItemType; label: string }[] = [
  { value: ReleaseItemType.FEATURE, label: "Feature" },
  { value: ReleaseItemType.BUG, label: "Bug" },
  { value: ReleaseItemType.HOTFIX, label: "Hotfix" },
  { value: ReleaseItemType.INFRASTRUCTURE, label: "Infrastructure" },
  { value: ReleaseItemType.TECHNICAL, label: "Technical" },
];

const statusOptions: { value: ReleaseItemStatus; label: string }[] = [
  { value: ReleaseItemStatus.TODO, label: "To do" },
  { value: ReleaseItemStatus.IN_PROGRESS, label: "In progress" },
  { value: ReleaseItemStatus.QA_PENDING, label: "QA pending" },
  { value: ReleaseItemStatus.READY, label: "Ready" },
];

export function ItemForm({
  releaseId,
  item,
  onCancel,
}: {
  releaseId: string;
  item?: { id: string } & ReleaseItemFormValues;
  onCancel: () => void;
}) {
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
      <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${prefix}-reference`} className="text-sm font-semibold text-[#243930]">Reference</label>
          <input id={`${prefix}-reference`} name="externalReference" type="text" autoComplete="off" maxLength={40} defaultValue={state.values.externalReference} aria-invalid={Boolean(state.errors.externalReference)} aria-describedby={state.errors.externalReference ? `${prefix}-externalReference-error` : undefined} placeholder="KAR-321" className={`${inputClassName} font-mono uppercase`} />
          {errorFor("externalReference")}
        </div>
        <div>
          <label htmlFor={`${prefix}-title`} className="text-sm font-semibold text-[#243930]">Title</label>
          <input id={`${prefix}-title`} name="title" type="text" autoComplete="off" maxLength={160} defaultValue={state.values.title} aria-invalid={Boolean(state.errors.title)} aria-describedby={state.errors.title ? `${prefix}-title-error` : undefined} placeholder="Fix payment retries" className={inputClassName} />
          {errorFor("title")}
        </div>
        <div>
          <label htmlFor={`${prefix}-type`} className="text-sm font-semibold text-[#243930]">Type</label>
          <select id={`${prefix}-type`} name="type" defaultValue={state.values.type} aria-invalid={Boolean(state.errors.type)} aria-describedby={state.errors.type ? `${prefix}-type-error` : undefined} className={inputClassName}>
            {typeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          {errorFor("type")}
        </div>
        <div>
          <label htmlFor={`${prefix}-status`} className="text-sm font-semibold text-[#243930]">Readiness status</label>
          <select id={`${prefix}-status`} name="status" defaultValue={state.values.status} aria-invalid={Boolean(state.errors.status)} aria-describedby={state.errors.status ? `${prefix}-status-error` : undefined} className={inputClassName}>
            {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          {errorFor("status")}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={`${prefix}-notes`} className="text-sm font-semibold text-[#243930]">Notes <span className="font-normal text-[#7b8982]">(optional)</span></label>
          <textarea id={`${prefix}-notes`} name="notes" rows={3} maxLength={1000} defaultValue={state.values.notes} aria-invalid={Boolean(state.errors.notes)} aria-describedby={state.errors.notes ? `${prefix}-notes-error` : undefined} className="mt-1.5 block w-full resize-y rounded-[6px] border border-[#cbd8d1] bg-white px-3 py-2 text-sm text-[#1d2925] outline-none focus:border-[#0d6b57] focus:ring-2 focus:ring-[#c8e9db] aria-invalid:border-[#c44d4d]" />
          {errorFor("notes")}
        </div>
      </div>
      {state.message && <p className="mt-4 text-sm text-[#a13e3b]" role="alert">{state.message}</p>}
      <div className="mt-5 flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="inline-flex h-9 items-center gap-1.5 px-2 text-sm font-medium text-[#5b6c63] hover:text-[#1d2925]"><X size={15} aria-hidden="true" /> Cancel</button>
        <button type="submit" disabled={pending} className="inline-flex h-9 min-w-27 items-center justify-center gap-1.5 rounded-[6px] bg-[#0d6b57] px-3 text-sm font-medium text-white hover:bg-[#095442] disabled:cursor-wait disabled:opacity-65">
          {pending ? <LoaderCircle size={15} className="animate-spin" aria-hidden="true" /> : <Save size={15} aria-hidden="true" />}
          {pending ? "Saving..." : item ? "Save item" : "Add item"}
        </button>
      </div>
    </form>
  );
}
