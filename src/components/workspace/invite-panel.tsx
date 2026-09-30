"use client";

import { useActionState, useState } from "react";
import { Copy } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { createInvitationAction, type InvitationFormState } from "@/server/actions/workspaces";

const initialState: InvitationFormState = {};

export function InvitePanel() {
  const t = useTranslations("Workspace");
  const locale = useLocale();
  const [state, action, pending] = useActionState(createInvitationAction, initialState);
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    if (!state.path) return;
    await navigator.clipboard.writeText(new URL(state.path, window.location.origin).href);
    setCopied(true);
  }

  return (
    <section aria-labelledby="invite-heading" className="border-t border-[#dce5df] pt-8">
      <h2 id="invite-heading" className="text-lg font-semibold text-[#192822]">{t("invite")}</h2>
      <p className="mt-2 text-sm text-[#607269]">{t("inviteHelp")}</p>
      <form action={action} className="mt-5">
        <input type="hidden" name="locale" value={locale} />
        <button type="submit" disabled={pending} className="inline-flex h-10 items-center rounded-[6px] bg-[#0b7059] px-4 text-sm font-semibold text-white hover:bg-[#075540] disabled:opacity-60">{t(pending ? "inviting" : "inviteAction")}</button>
      </form>
      {state.error && <p role="alert" className="mt-3 text-sm text-[#a23b33]">{state.error}</p>}
      {state.path && <div className="mt-4 flex max-w-xl items-center gap-2">
        <input readOnly aria-label={t("invite")} value={state.path} className="h-10 min-w-0 flex-1 rounded-[5px] border border-[#cbd8cf] bg-white px-3 font-mono text-xs text-[#334d40]" />
        <button type="button" onClick={copyLink} title={t("copy")} aria-label={t("copy")} className="flex size-10 shrink-0 items-center justify-center rounded-[5px] border border-[#cbd8cf] bg-white text-[#0b7059] hover:bg-[#edf5f0]"><Copy size={16} /></button>
        {copied && <span className="text-xs text-[#0b7059]">{t("copied")}</span>}
      </div>}
    </section>
  );
}
