import { getTranslations } from "next-intl/server";
import { WorkspaceCreateForm } from "@/components/workspace/workspace-create-form";
import { requireAuthenticatedUser } from "@/server/access";

export default async function NewWorkspacePage() {
  await requireAuthenticatedUser();
  const t = await getTranslations("Workspace");
  return <main className="mx-auto max-w-7xl px-5 py-9 sm:px-8 sm:py-12">
    <h1 className="text-[32px] font-semibold text-[#192822]">{t("createTitle")}</h1>
    <p className="mt-2 text-sm text-[#607269]">{t("createSubtitle")}</p>
    <WorkspaceCreateForm />
  </main>;
}
