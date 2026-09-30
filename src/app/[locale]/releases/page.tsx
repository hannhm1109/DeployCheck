import { connection } from "next/server";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowUpRight, Plus } from "lucide-react";
import { ReleaseStatusBadge } from "@/features/releases/status-badge";
import { formatDate } from "@/lib/format-date";
import { Link } from "@/i18n/navigation";
import { listReleases } from "@/server/data/releases";
import { isReadOnlyDemo } from "@/server/demo-access";

export default async function ReleasesPage() {
  await connection();
  const [releases, locale, t, nav, common] = await Promise.all([
    listReleases(), getLocale(), getTranslations("Releases"), getTranslations("Nav"), getTranslations("Common"),
  ]);
  const readOnly = isReadOnlyDemo();

  return (
    <main className="mx-auto max-w-7xl px-5 py-9 sm:px-8 sm:py-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="text-[32px] font-semibold leading-tight text-[#192822]">{nav("releases")}</h1>
          <p className="mt-1.5 text-sm text-[#607269]">{t("count", { count: releases.length })}</p>
        </div>
        {!readOnly && <Link href="/releases/new" className="inline-flex h-10 items-center justify-center gap-2 rounded-[6px] bg-[#0b7059] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#075540] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b7059]">
          <Plus size={16} strokeWidth={2.2} aria-hidden="true" /> {common("newRelease")}
        </Link>}
      </div>
      {releases.length === 0 ? (
        <section className="border-y border-[#d9e2dd] py-16 text-center">
          <h2 className="text-lg font-semibold">{t("emptyTitle")}</h2>
          <p className="mt-2 text-sm text-[#64746e]">{readOnly ? t("emptyDemo") : t("emptyCreate")}</p>
          {!readOnly && <Link href="/releases/new" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#0d6b57] hover:underline"><Plus size={16} aria-hidden="true" /> {common("newRelease")}</Link>}
        </section>
      ) : (
        <section aria-label={nav("releases")}>
          <div className="hidden grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_105px_125px_24px] gap-5 border-x border-t border-[#dce5df] bg-[#eef3f0] px-5 py-3 text-[11px] font-semibold uppercase text-[#607269] md:grid">
            <span>{t("release")}</span><span>{t("project")}</span><span>{t("status")}</span><span>{t("targetDate")}</span><span className="sr-only">{t("release")}</span>
          </div>
          <ul className="divide-y divide-[#e5ebe7] border border-[#dce5df] bg-white">
            {releases.map((release) => (
              <li key={release.id}>
                <Link href={`/releases/${release.id}`} className="grid min-h-23 grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-4 transition-colors hover:bg-[#f3f8f5] focus-visible:outline-2 focus-visible:outline-[#0b7059] md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_105px_125px_24px] md:gap-5 md:px-5">
                  <span className="min-w-0"><span className="block truncate font-mono text-sm font-semibold text-[#1c4033]">{release.version}</span><span className="mt-1 block truncate text-sm text-[#65766d]">{release.title}</span><span className="mt-1 block truncate text-xs text-[#76877d] md:hidden">{release.project.name}</span></span>
                  <span className="hidden truncate text-sm text-[#40544b] md:block">{release.project.name}</span>
                  <ReleaseStatusBadge status={release.status} />
                  <span className="hidden whitespace-nowrap text-sm text-[#63746b] md:block">{release.targetDeploymentDate ? formatDate(release.targetDeploymentDate, locale) : common("notSet")}</span>
                  <ArrowUpRight size={17} className="hidden text-[#81958a] md:block" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
