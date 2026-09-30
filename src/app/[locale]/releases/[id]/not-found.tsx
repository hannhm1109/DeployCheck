import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";

export default function ReleaseNotFound() {
  const t = useTranslations("Errors");
  return (
    <main className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
      <h1 className="text-2xl font-semibold text-[#172d27]">{t("releaseNotFound")}</h1>
      <p className="mt-3 text-sm text-[#64746e]">{t("releaseRemoved")}</p>
      <Link href="/releases" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#0d6b57] hover:underline"><ArrowLeft size={16} aria-hidden="true" /> {t("backReleases")}</Link>
    </main>
  );
}
