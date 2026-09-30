import { connection } from "next/server";
import { getTranslations } from "next-intl/server";
import { ArrowLeft, Plus } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { ReleaseForm } from "@/features/releases/release-form";
import { listProjectOptions } from "@/server/data/projects";
import { isReadOnlyDemo } from "@/server/demo-access";
import { requireActiveWorkspace } from "@/server/access";

export default async function NewReleasePage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  await connection();
  const { workspace } = await requireActiveWorkspace();
  const [{ project: projectSlug }, projects] = await Promise.all([
    searchParams,
    listProjectOptions(workspace.id),
  ]);
  const selectedProjectId = projects.find((project) => project.slug === projectSlug)?.id;
  const [t, nav, common] = await Promise.all([
    getTranslations("Releases"), getTranslations("Nav"), getTranslations("Common"),
  ]);
  const readOnly = isReadOnlyDemo();

  return (
    <main className="mx-auto max-w-7xl px-5 py-9 sm:px-8 sm:py-12">
      <Link href="/releases" className="inline-flex items-center gap-2 text-sm font-medium text-[#60736a] hover:text-[#0d6b57] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f7663]">
        <ArrowLeft size={16} aria-hidden="true" /> {nav("releases")}
      </Link>
      <div className="mt-7 max-w-2xl">
        <h1 className="text-[32px] font-semibold leading-tight text-[#192822]">{common("newRelease")}</h1>
        {readOnly ? (
          <p className="mt-9 border-y border-[#d9e2dd] py-10 text-sm text-[#64746e]">{t("readOnlyRelease")}</p>
        ) : projects.length === 0 ? (
          <div className="mt-9 border-y border-[#d9e2dd] py-10">
            <p className="text-sm text-[#64746e]">{t("newNeedsProject")}</p>
            <Link href="/projects/new" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#0d6b57] hover:underline"><Plus size={16} aria-hidden="true" /> {common("newProject")}</Link>
          </div>
        ) : (
          <ReleaseForm projects={projects} selectedProjectId={selectedProjectId} />
        )}
      </div>
    </main>
  );
}
