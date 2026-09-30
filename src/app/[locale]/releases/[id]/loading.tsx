import { LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";

export default function LoadingRelease() {
  const t = useTranslations("Common");
  return (
    <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
      <div role="status" aria-live="polite" className="inline-flex items-center gap-2 text-sm font-medium text-[#40544b]">
        <LoaderCircle size={18} className="motion-safe:animate-spin" aria-hidden="true" />
        {t("loadingRelease")}
      </div>
      <div aria-hidden="true" className="mt-8 space-y-6 motion-safe:animate-pulse">
        <div className="h-10 w-44 max-w-full rounded-[4px] bg-[#e4ebe7]" />
        <div className="h-24 border-y border-[#d9e2dd] bg-[#eff3f0]" />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div className="h-64 bg-[#eff3f0]" />
          <div className="h-40 bg-[#eff3f0]" />
        </div>
      </div>
    </main>
  );
}
