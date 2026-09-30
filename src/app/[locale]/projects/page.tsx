import { connection } from "next/server";
import { getTranslations } from "next-intl/server";
import { ArrowUpRight, Plus } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { listProjects } from "@/server/data/projects";
import { isReadOnlyDemo } from "@/server/demo-access";
import { requireActiveWorkspace } from "@/server/access";

export default async function ProjectsPage() {
  await connection();
  const { workspace } = await requireActiveWorkspace();
  const [projects, t, nav, common] = await Promise.all([
    listProjects(workspace.id), getTranslations("Projects"), getTranslations("Nav"), getTranslations("Common"),
  ]);
  const readOnly = isReadOnlyDemo();

  return (
    <main className="mx-auto max-w-7xl px-5 py-9 sm:px-8 sm:py-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="text-[32px] font-semibold leading-tight text-[#192822]">
            {nav("projects")}
          </h1>
          <p className="mt-1.5 text-sm text-[#607269]">
            {t("count", { count: projects.length })}
          </p>
        </div>
        {!readOnly && <Link
          href="/projects/new"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-[6px] bg-[#0b7059] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#075540] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b7059]"
        >
          <Plus size={16} strokeWidth={2.2} aria-hidden="true" />
          {common("newProject")}
        </Link>}
      </div>

      {projects.length === 0 ? (
        <section className="border-y border-[#d9e2dd] py-16 text-center">
          <h2 className="text-lg font-semibold">{t("emptyTitle")}</h2>
          <p className="mt-2 text-sm text-[#64746e]">{readOnly ? t("emptyDemo") : t("emptyCreate")}</p>
          {!readOnly && <Link
            href="/projects/new"
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#0d6b57] underline-offset-4 hover:underline"
          >
            <Plus size={16} aria-hidden="true" />
            {common("newProject")}
          </Link>}
        </section>
      ) : (
        <section aria-label={nav("projects")}>
          <div className="hidden grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_90px_24px] gap-5 border-x border-t border-[#dce5df] bg-[#eef3f0] px-5 py-3 text-[11px] font-semibold uppercase text-[#607269] md:grid">
            <span>{t("project")}</span>
            <span>{t("slug")}</span>
            <span>{t("releaseCount")}</span>
            <span className="sr-only">{common("open")}</span>
          </div>
          <ul className="divide-y divide-[#e5ebe7] border border-[#dce5df] bg-white">
            {projects.map((project) => (
              <li key={project.id}>
                <Link
                  href={`/projects/${project.slug}`}
                  className="grid min-h-23 grid-cols-[minmax(0,1fr)_auto] items-center gap-5 px-4 py-4 transition-colors hover:bg-[#f3f8f5] focus-visible:outline-2 focus-visible:outline-[#0b7059] md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_90px_24px] md:px-5"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-[#1b3029]">
                      {project.name}
                    </span>
                    {project.description && (
                      <span className="mt-1 block truncate text-sm text-[#687872]">
                        {project.description}
                      </span>
                    )}
                    <span className="mt-1 block truncate font-mono text-xs text-[#76867f] md:hidden">
                      {project.slug}
                    </span>
                  </span>
                  <span className="hidden truncate font-mono text-xs text-[#596b63] md:block">
                    {project.slug}
                  </span>
                  <span className="text-right text-sm tabular-nums text-[#40544b] md:text-left">
                    {project._count.releases}
                    <span className="ml-1 text-xs text-[#64746e] md:hidden">{t("releaseCount").toLowerCase()}</span>
                  </span>
                  <ArrowUpRight
                    size={17}
                    className="hidden text-[#81958a] md:block"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
