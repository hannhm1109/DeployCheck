import { getTranslations } from "next-intl/server";
import { InvitePanel } from "@/components/workspace/invite-panel";
import { requireActiveWorkspace } from "@/server/access";
import { getDb } from "@/server/db";
import { isReadOnlyDemo } from "@/server/demo-access";

export default async function TeamPage() {
  const { workspace, membership } = await requireActiveWorkspace();
  const [members, t] = await Promise.all([
    getDb().membership.findMany({
      where: { workspaceId: workspace.id },
      select: { id: true, role: true, user: { select: { name: true, email: true } } },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    }),
    getTranslations("Workspace"),
  ]);

  return <main className="mx-auto max-w-7xl px-5 py-9 sm:px-8 sm:py-12">
    <h1 className="text-[32px] font-semibold text-[#192822]">{workspace.name}</h1>
    <section aria-labelledby="members-heading" className="mt-9 max-w-3xl">
      <h2 id="members-heading" className="text-lg font-semibold text-[#192822]">{t("members")}</h2>
      <ul className="mt-4 divide-y divide-[#e5ebe7] border-y border-[#dce5df]">
        {members.map((entry) => <li key={entry.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
          <span className="min-w-0"><strong className="block truncate text-sm text-[#192822]">{entry.user.name}</strong><span className="block truncate text-xs text-[#607269]">{entry.user.email}</span></span>
          <span className="text-xs font-medium text-[#607269]">{t(entry.role === "OWNER" ? "owner" : "member")}</span>
        </li>)}
      </ul>
    </section>
    {membership.role === "OWNER" && !isReadOnlyDemo() && <div className="mt-10 max-w-3xl"><InvitePanel /></div>}
  </main>;
}
