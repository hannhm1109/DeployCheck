import { LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";

export default function Loading() {
  const t = useTranslations("Common");
  return (
    <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
      <div role="status" aria-live="polite" className="inline-flex items-center gap-2 text-sm font-medium text-[#40544b]">
        <LoaderCircle size={18} className="motion-safe:animate-spin" aria-hidden="true" />
        {t("loadingPage")}
      </div>
      <div aria-hidden="true" className="mt-8 space-y-5 motion-safe:animate-pulse">
        <div className="h-9 w-52 max-w-full rounded-[4px] bg-[#e4ebe7]" />
        <div className="h-18 border-y border-[#d9e2dd] bg-[#eff3f0]" />
        <div className="h-18 border-y border-[#d9e2dd] bg-[#eff3f0]" />
      </div>
    </main>
  );
}
