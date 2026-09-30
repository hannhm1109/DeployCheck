"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { createWorkspaceAction, type WorkspaceFormState } from "@/server/actions/workspaces";

const initialState: WorkspaceFormState = {};

export function WorkspaceCreateForm() {
  const t = useTranslations("Workspace");
  const locale = useLocale();
  const [state, action, pending] = useActionState(createWorkspaceAction, initialState);

  return (
    <form action={action} className="mt-8 max-w-md space-y-5">
      <input type="hidden" name="locale" value={locale} />
      <label className="block text-sm font-medium text-[#334d40]">{t("name")}
        <input name="name" required minLength={2} maxLength={80} placeholder={t("namePlaceholder")} className="mt-2 block h-11 w-full rounded-[5px] border border-[#cbd8cf] bg-white px-3 text-[#192822] focus:border-[#0b7059] focus:outline-none" />
      </label>
      {state.error && <p role="alert" className="text-sm text-[#a23b33]">{state.error}</p>}
      <button type="submit" disabled={pending} className="inline-flex h-11 items-center rounded-[6px] bg-[#0b7059] px-5 text-sm font-semibold text-white hover:bg-[#075540] disabled:opacity-60">{t(pending ? "creating" : "create")}</button>
    </form>
  );
}
