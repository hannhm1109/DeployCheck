import { connection } from "next/server";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { ProjectForm } from "@/features/projects/project-form";
import { isReadOnlyDemo } from "@/server/demo-access";

export default async function NewProjectPage() {
  await connection();
  const [t, nav, common] = await Promise.all([
    getTranslations("Releases"), getTranslations("Nav"), getTranslations("Common"),
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
      <div className="mt-7 max-w-2xl">
        <h1 className="text-[32px] font-semibold leading-tight text-[#192822]">
          {common("newProject")}
        </h1>
        {readOnly ? (
          <p className="mt-9 border-y border-[#d9e2dd] py-10 text-sm text-[#64746e]">{t("readOnlyProject")}</p>
        ) : <ProjectForm />}
      </div>
    </main>
  );
}
