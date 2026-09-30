"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const t = useTranslations("Auth");
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return <button type="button" disabled={busy} onClick={async () => {
    setBusy(true);
    await authClient.signOut();
    router.replace("/sign-in");
    router.refresh();
  }} title={t("signOut")} aria-label={t("signOut")} className="flex size-8 shrink-0 items-center justify-center rounded-[5px] text-[#607269] hover:bg-[#edf5f0] hover:text-[#0b7059] disabled:opacity-50"><LogOut size={17} /></button>;
}
