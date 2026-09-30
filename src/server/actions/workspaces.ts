"use server";

import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { localePath, parseLocale } from "@/i18n/routing";
import { requireActiveWorkspace, requireAuthenticatedUser, requireWorkspaceMembership, setActiveWorkspaceCookie } from "@/server/access";
import { createInvitation, createWorkspace, InvalidInvitationError, joinWorkspace } from "@/server/services/workspaces";

const workspaceNameSchema = z.string().trim().min(2).max(80);

export type WorkspaceFormState = { error?: string };
export type InvitationFormState = { error?: string; path?: string };

export async function createWorkspaceAction(_previous: WorkspaceFormState, formData: FormData): Promise<WorkspaceFormState> {
  const user = await requireAuthenticatedUser();
  const locale = parseLocale(formData.get("locale"));
  const parsed = workspaceNameSchema.safeParse(formData.get("name"));
  if (!parsed.success) return { error: locale === "fr" ? "Saisissez un nom de 2 à 80 caractères." : "Enter a name between 2 and 80 characters." };

  const workspace = await createWorkspace(user.id, parsed.data);
  await setActiveWorkspaceCookie(workspace.id);
  redirect(localePath(locale, "/"));
}

export async function switchWorkspaceAction(workspaceId: string, localeInput: string): Promise<void> {
  await requireWorkspaceMembership(workspaceId);
  await setActiveWorkspaceCookie(workspaceId);
  redirect(localePath(parseLocale(localeInput), "/"));
}

export async function createInvitationAction(_previous: InvitationFormState, formData: FormData): Promise<InvitationFormState> {
  const { user, workspace, membership } = await requireActiveWorkspace();
  const locale = parseLocale(formData.get("locale"));
  if (membership.role !== "OWNER") notFound();
  const token = await createInvitation(workspace.id, user.id);
  return { path: localePath(locale, `/join/${token}`) };
}

export async function joinWorkspaceAction(token: string, localeInput: string): Promise<void> {
  const user = await requireAuthenticatedUser();
  let workspaceId: string;
  try {
    workspaceId = await joinWorkspace(user.id, token);
  } catch (error) {
    if (error instanceof InvalidInvitationError) redirect(localePath(parseLocale(localeInput), `/join/${token}`));
    throw error;
  }
  await setActiveWorkspaceCookie(workspaceId);
  redirect(localePath(parseLocale(localeInput), "/"));
}
