"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";

export function AuthForm({ mode, nextPath }: { mode: "sign-in" | "sign-up"; nextPath: string }) {
  const t = useTranslations("Auth");
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const signingUp = mode === "sign-up";
  const otherPath = `${signingUp ? "/sign-in" : "/sign-up"}${nextPath === "/" ? "" : `?next=${encodeURIComponent(nextPath)}`}`;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    const name = String(data.get("name") ?? "").trim();
    setBusy(true);
    setError(null);
    try {
      const response = signingUp
        ? await authClient.signUp.email({ name, email, password })
        : await authClient.signIn.email({ email, password });
      if (response.error) {
        setError(t(signingUp ? "signUpError" : "signInError"));
        return;
      }
      router.replace(nextPath);
      router.refresh();
    } catch {
      setError(t(signingUp ? "signUpError" : "signInError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-5 py-12 sm:py-16">
      <h1 className="text-[32px] font-semibold text-[#192822]">{t(signingUp ? "signUp" : "signIn")}</h1>
      <form onSubmit={submit} className="mt-8 space-y-5">
        {signingUp && <label className="block text-sm font-medium text-[#334d40]">{t("name")}<input name="name" type="text" autoComplete="name" required minLength={2} maxLength={100} className="mt-2 block h-11 w-full rounded-[5px] border border-[#cbd8cf] bg-white px-3 text-[#192822] focus:border-[#0b7059] focus:outline-none" /></label>}
        <label className="block text-sm font-medium text-[#334d40]">{t("email")}<input name="email" type="email" autoComplete="email" required className="mt-2 block h-11 w-full rounded-[5px] border border-[#cbd8cf] bg-white px-3 text-[#192822] focus:border-[#0b7059] focus:outline-none" /></label>
        <label className="block text-sm font-medium text-[#334d40]">{t("password")}<input name="password" type="password" autoComplete={signingUp ? "new-password" : "current-password"} required minLength={signingUp ? 8 : undefined} className="mt-2 block h-11 w-full rounded-[5px] border border-[#cbd8cf] bg-white px-3 text-[#192822] focus:border-[#0b7059] focus:outline-none" /></label>
        {error && <p role="alert" className="text-sm text-[#a23b33]">{error}</p>}
        <button type="submit" disabled={busy} className="inline-flex h-11 w-full items-center justify-center rounded-[6px] bg-[#0b7059] px-4 text-sm font-semibold text-white hover:bg-[#075540] disabled:opacity-60">{busy ? t(signingUp ? "creatingAccount" : "signingIn") : t(signingUp ? "signUp" : "signIn")}</button>
      </form>
      <p className="mt-7 text-sm text-[#607269]">{t(signingUp ? "haveAccount" : "needAccount")} <Link href={otherPath} className="font-semibold text-[#0b7059] hover:underline">{t(signingUp ? "signIn" : "signUp")}</Link></p>
    </div>
  );
}
