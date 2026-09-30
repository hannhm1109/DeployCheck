import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { cache } from "react";
import { localePath, parseLocale } from "@/i18n/routing";
import { auth } from "@/server/auth";
import { getDb } from "@/server/db";

export const ACTIVE_WORKSPACE_COOKIE = "deploycheck_workspace";

export const getAuthenticatedUser = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
});

export async function requireAuthenticatedUser() {
  const user = await getAuthenticatedUser();
  if (!user) redirect(localePath(parseLocale(await getLocale()), "/sign-in"));
  return user;
}

export async function requireWorkspaceMembership(workspaceId: string) {
  const user = await requireAuthenticatedUser();
  const membership = await getDb().membership.findUnique({
    where: { userId_workspaceId: { userId: user.id, workspaceId } },
    include: { workspace: true },
  });
  if (!membership) notFound();
  return membership;
}

export const getWorkspaceState = cache(async () => {
  const user = await getAuthenticatedUser();
  if (!user) return null;
  const memberships = await getDb().membership.findMany({
    where: { userId: user.id },
    include: { workspace: true },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
  const requestedId = (await cookies()).get(ACTIVE_WORKSPACE_COOKIE)?.value;
  const active = memberships.find((entry) => entry.workspaceId === requestedId) ?? memberships[0] ?? null;
  return { user, membership: active, workspace: active?.workspace ?? null, memberships };
});

export async function requireActiveWorkspace() {
  const state = await getWorkspaceState();
  if (!state) redirect(localePath(parseLocale(await getLocale()), "/sign-in"));
  if (!state.workspace || !state.membership) redirect(localePath(parseLocale(await getLocale()), "/workspaces/new"));
  return { ...state, workspace: state.workspace, membership: state.membership };
}

export async function setActiveWorkspaceCookie(workspaceId: string) {
  (await cookies()).set(ACTIVE_WORKSPACE_COOKIE, workspaceId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}
