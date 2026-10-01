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
  const [error, setError] = useState(false);

  async function signOut() {
    setBusy(true);
    setError(false);
    try {
      const result = await authClient.signOut();
      if (result.error) {
        setError(true);
        return;
      }
      router.replace("/sign-in");
      router.refresh();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return <div className="relative">
    <button type="button" disabled={busy} onClick={signOut} title={t("signOut")} aria-label={t("signOut")} className="flex size-8 shrink-0 items-center justify-center rounded-[5px] text-[#607269] hover:bg-[#edf5f0] hover:text-[#0b7059] disabled:opacity-50"><LogOut size={17} /></button>
    {error && <p role="alert" className="absolute right-0 top-full z-50 mt-2 w-56 rounded-[5px] border border-[#e7c8c4] bg-white p-3 text-xs text-[#a23b33] shadow-sm">{t("signOutError")}</p>}
  </div>;
}
