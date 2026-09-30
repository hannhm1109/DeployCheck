import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { AuthForm } from "@/components/auth/auth-form";
import { authNextPath } from "@/lib/auth-next";
import { localePath, parseLocale } from "@/i18n/routing";
import { getAuthenticatedUser } from "@/server/access";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const nextPath = authNextPath((await searchParams).next);
  if (await getAuthenticatedUser()) redirect(localePath(parseLocale(await getLocale()), nextPath));
  return <main><AuthForm mode="sign-in" nextPath={nextPath} /></main>;
}
