import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowLeft, Plus } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { ReleaseStatusBadge } from "@/features/releases/status-badge";
import { formatDate } from "@/lib/format-date";
import { getProjectBySlug } from "@/server/data/projects";
import { isReadOnlyDemo } from "@/server/demo-access";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await connection();
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) notFound();
  const [locale, t, nav, common] = await Promise.all([
    getLocale(), getTranslations("Projects"), getTranslations("Nav"), getTranslations("Common"),
  ]);
  const readOnly = isReadOnlyDemo();

  return (
    <main className="mx-auto max-w-7xl px-5 py-9 sm:px-8 sm:py-12">
      <Link
        href="/projects"
        className="inline-flex items-center gap-2 text-sm font-medium text-[#60736a] hover:text-[#0d6b57] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f7663]"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        {nav("projects")}
      </Link>

      <header className="mt-7 border-b border-[#dce5df] pb-7">
        <h1 className="break-words text-[32px] font-semibold leading-tight text-[#192822]">
          {project.name}
        </h1>
        <p className="mt-2 break-all font-mono text-xs text-[#6d7d74]">
          {project.slug}
        </p>
        {project.description && (
          <p className="mt-5 max-w-2xl break-words text-sm leading-6 text-[#4e6157]">
            {project.description}
          </p>
        )}
      </header>

      <div className="grid gap-10 pt-8 lg:grid-cols-[minmax(0,1fr)_240px] lg:gap-12">
        <section aria-labelledby="releases-heading" className="min-w-0">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <h2 id="releases-heading" className="text-lg font-semibold text-[#1b3029]">
              {nav("releases")} <span className="ml-1 text-sm font-normal tabular-nums text-[#64746e]">{project.releases.length}</span>
            </h2>
            {!readOnly && <Link href={`/releases/new?project=${encodeURIComponent(project.slug)}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0d6b57] hover:underline">
              <Plus size={16} aria-hidden="true" /> {common("newRelease")}
            </Link>}
          </div>
          {project.releases.length === 0 ? (
            <div className="border-y border-[#d9e2dd] py-12 text-sm text-[#6b7d72]">
              {t("noReleases")}
            </div>
          ) : (
            <ul className="divide-y divide-[#e5ebe7] border border-[#dce5df] bg-white">
              {project.releases.map((release) => (
                <li key={release.id}>
                  <Link href={`/releases/${release.id}`} className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3 px-5 py-4 transition-colors hover:bg-[#f3f8f5] focus-visible:outline-2 focus-visible:outline-[#0b7059]">
                    <div className="min-w-0">
                      <span className="font-mono text-sm font-semibold text-[#1c4033]">{release.version}</span>
                      <p className="mt-1 truncate text-sm text-[#65766d]">{release.title}</p>
                    </div>
                    <div className="flex items-center gap-3">
                    {release.targetDeploymentDate && (
                      <span className="hidden whitespace-nowrap text-xs text-[#76877d] sm:inline">
                        {formatDate(release.targetDeploymentDate, locale)}
                      </span>
                    )}
                      <ReleaseStatusBadge status={release.status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="border-t border-[#d9e2dd] pt-6 lg:border-t-0 lg:border-l lg:pl-8 lg:pt-0">
          <h2 className="text-sm font-semibold text-[#263b31]">{t("details")}</h2>
          <dl className="mt-5 space-y-5 text-sm">
            <div>
              <dt className="text-[#64746e]">{t("created")}</dt>
              <dd className="mt-1 font-medium text-[#2a3d33]">
                {formatDate(project.createdAt, locale)}
              </dd>
            </div>
            <div>
              <dt className="text-[#64746e]">{t("updated")}</dt>
              <dd className="mt-1 font-medium text-[#2a3d33]">
                {formatDate(project.updatedAt, locale)}
              </dd>
            </div>
          </dl>
        </aside>
      </div>
    </main>
  );
}
