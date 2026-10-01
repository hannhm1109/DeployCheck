"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { switchWorkspaceAction } from "@/server/actions/workspaces";

export function WorkspaceSwitcher({ workspaces, activeId }: { workspaces: { id: string; name: string }[]; activeId: string }) {
  const t = useTranslations("Workspace");
  const locale = useLocale();
  const [pending, startTransition] = useTransition();

  return <select aria-label={t("switch")} title={t("switch")} value={activeId} disabled={pending} onChange={(event) => {
    const id = event.target.value;
    startTransition(async () => { await switchWorkspaceAction(id, locale); });
  }} className="h-9 max-w-44 rounded-[5px] border border-[#dce5df] bg-white px-2 text-xs font-medium text-[#334d40] focus:border-[#0b7059] focus:outline-none disabled:opacity-60">
    {workspaces.map((workspace) => <option key={workspace.id} value={workspace.id}>{workspace.name}</option>)}
  </select>;
}
