import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { joinWorkspaceAction } from "@/server/actions/workspaces";
import { getAuthenticatedUser } from "@/server/access";
import { getInvitation } from "@/server/services/workspaces";

export default async function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [invitation, user, locale, t, auth] = await Promise.all([
    getInvitation(token), getAuthenticatedUser(), getLocale(), getTranslations("Workspace"), getTranslations("Auth"),
  ]);
  const next = encodeURIComponent(`/join/${token}`);

  return <main className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
    <div className="max-w-xl">
      {invitation ? <>
        <h1 className="text-[32px] font-semibold text-[#192822]">{t("joinTitle", { name: invitation.workspace.name })}</h1>
        {user ? <form action={joinWorkspaceAction.bind(null, token, locale)} className="mt-8"><button type="submit" className="inline-flex h-11 items-center rounded-[6px] bg-[#0b7059] px-5 text-sm font-semibold text-white hover:bg-[#075540]">{t("join")}</button></form>
          : <><p className="mt-3 text-sm text-[#607269]">{t("signInToJoin")}</p><div className="mt-7 flex gap-4"><Link href={`/sign-in?next=${next}`} className="text-sm font-semibold text-[#0b7059] hover:underline">{auth("signIn")}</Link><Link href={`/sign-up?next=${next}`} className="text-sm font-semibold text-[#0b7059] hover:underline">{auth("signUp")}</Link></div></>}
      </> : <h1 className="text-xl font-semibold text-[#192822]">{t("invalidInvite")}</h1>}
    </div>
  </main>;
}
