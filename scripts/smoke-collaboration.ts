import "dotenv/config";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { ChecklistKind, DeploymentResult, ReleaseStatus } from "../src/generated/prisma/enums";
import { getDb } from "../src/server/db";
import { getProjectBySlug, listProjects } from "../src/server/data/projects";
import { getReleaseById } from "../src/server/data/releases";
import { getOverview } from "../src/server/data/overview";
import { listDeploymentHistory } from "../src/server/data/deployments";
import { ChecklistReleaseNotFoundError, saveChecklistItem } from "../src/server/services/checklist";
import { ReleaseTransitionNotFoundError, transitionReleaseStatus } from "../src/server/services/lifecycle";
import { createProject } from "../src/server/services/projects";
import { createRelease, ReleaseProjectNotFoundError } from "../src/server/services/releases";
import { createInvitation, createWorkspace, joinWorkspace } from "../src/server/services/workspaces";

const baseUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
const db = getDb();

async function register(name: string) {
  const email = `smoke-${randomBytes(8).toString("hex")}@example.test`;
  const password = `${randomBytes(20).toString("hex")}Aa1!`;
  const response = await fetch(`${baseUrl}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: baseUrl },
    body: JSON.stringify({ name, email, password }),
  });
  if (response.status !== 200) throw new Error(`Sign-up failed (${response.status}): ${await response.text()}`);
  const data = await response.json() as { user: { id: string } };
  const cookie = response.headers.getSetCookie().map((header) => header.split(";", 1)[0]).join("; ");
  assert.ok(cookie.includes("session_token"));
  return { id: data.user.id, cookie };
}

async function page(path: string, cookie = "") {
  const response = await fetch(`${baseUrl}${path}`, { headers: cookie ? { cookie } : {} });
  return { status: response.status, html: await response.text() };
}

async function main() {
  const userIds: string[] = [];
  const workspaceIds: string[] = [];
  let projectAId: string | undefined;
  let projectBId: string | undefined;
  let releaseId: string | undefined;
  const slug = `shared-${randomBytes(5).toString("hex")}`;
  const titleA = `Workspace A ${slug}`;
  const titleB = `Workspace B ${slug}`;

  try {
    const a = await register("User A"); userIds.push(a.id);
    const b = await register("User B"); userIds.push(b.id);
    const c = await register("User C"); userIds.push(c.id);

    const workspaceA = await createWorkspace(a.id, "Team A"); workspaceIds.push(workspaceA.id);
    const workspaceB = await createWorkspace(c.id, "Team B"); workspaceIds.push(workspaceB.id);
    const token = await createInvitation(workspaceA.id, a.id);
    assert.equal(await joinWorkspace(b.id, token), workspaceA.id);
    await assert.rejects(() => joinWorkspace(c.id, token));

    assert.ok(await db.membership.findUnique({ where: { userId_workspaceId: { userId: a.id, workspaceId: workspaceA.id } } }));
    assert.ok(await db.membership.findUnique({ where: { userId_workspaceId: { userId: b.id, workspaceId: workspaceA.id } } }));
    assert.equal(await db.membership.findUnique({ where: { userId_workspaceId: { userId: c.id, workspaceId: workspaceA.id } } }), null);

    const projectA = await createProject(workspaceA.id, { name: titleA, slug, description: null }); projectAId = projectA.id;
    const projectB = await createProject(workspaceB.id, { name: titleB, slug, description: null }); projectBId = projectB.id;
    assert.equal(projectA.workspaceId, workspaceA.id);
    assert.equal((await getProjectBySlug(workspaceA.id, slug))?.name, titleA);
    assert.equal((await getProjectBySlug(workspaceB.id, slug))?.name, titleB);
    assert.ok((await listProjects(workspaceA.id)).some((project) => project.id === projectA.id));
    assert.ok(!(await listProjects(workspaceB.id)).some((project) => project.id === projectA.id));

    const { release } = await createRelease(workspaceA.id, { projectId: projectA.id, version: "v1", title: `Private ${slug}`, description: null, targetDeploymentDate: null, rollbackNotes: null });
    releaseId = release.id;
    await assert.rejects(() => createRelease(workspaceB.id, { projectId: projectA.id, version: "v2", title: "Forbidden", description: null, targetDeploymentDate: null, rollbackNotes: null }), ReleaseProjectNotFoundError);
    assert.equal(await getReleaseById(workspaceB.id, release.id), null);
    await assert.rejects(() => saveChecklistItem(workspaceB.id, release.id, { kind: ChecklistKind.QA_VALIDATED, isComplete: true, changeRequired: null, notes: null }), ChecklistReleaseNotFoundError);
    await assert.rejects(() => transitionReleaseStatus(workspaceB.id, release.id, { nextStatus: ReleaseStatus.IN_REVIEW, notes: null }), ReleaseTransitionNotFoundError);

    await saveChecklistItem(workspaceA.id, release.id, { kind: ChecklistKind.QA_VALIDATED, isComplete: true, changeRequired: null, notes: "Shared QA result" });
    assert.equal((await getReleaseById(workspaceA.id, release.id))?.checklistItems.find((check) => check.kind === ChecklistKind.QA_VALIDATED)?.notes, "Shared QA result");
    await db.deployment.create({ data: { releaseId: release.id, result: DeploymentResult.FAILED, notes: "Isolation check" } });
    assert.equal((await listDeploymentHistory(workspaceB.id)).total, 0);
    assert.equal((await getOverview(workspaceB.id)).recentDeploymentCount, 0);

    const aPage = await page(`/projects/${slug}`, `${a.cookie}; deploycheck_workspace=${workspaceA.id}`);
    const bPage = await page(`/projects/${slug}`, `${b.cookie}; deploycheck_workspace=${workspaceA.id}`);
    const cPage = await page(`/projects/${slug}`, `${c.cookie}; deploycheck_workspace=${workspaceA.id}`);
    assert.ok(aPage.html.includes(titleA));
    assert.ok(bPage.html.includes(titleA));
    assert.ok(cPage.html.includes(titleB));
    assert.ok(!cPage.html.includes(titleA));
    const forbiddenRelease = await page(`/releases/${release.id}`, `${c.cookie}; deploycheck_workspace=${workspaceA.id}`);
    assert.ok(!forbiddenRelease.html.includes(`Private ${slug}`));
    const anonymous = await page(`/projects/${slug}`);
    assert.ok(!anonymous.html.includes(titleA));
    assert.ok(anonymous.html.includes("/sign-in"));

    console.log("Workspace membership, shared reads, isolation, mutations, and anonymous protection passed.");
  } finally {
    if (releaseId) {
      await db.deployment.deleteMany({ where: { releaseId } });
      await db.releaseChecklistItem.deleteMany({ where: { releaseId } });
      await db.releaseItem.deleteMany({ where: { releaseId } });
      await db.release.delete({ where: { id: releaseId } });
    }
    for (const id of [projectAId, projectBId]) if (id) await db.project.delete({ where: { id } });
    for (const id of workspaceIds) await db.workspace.delete({ where: { id } });
    for (const id of userIds) await db.user.delete({ where: { id } });
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
