import { afterEach, describe, expect, it, vi } from "vitest";
import { ChecklistKind, ReleaseStatus } from "../src/generated/prisma/enums";
import { ReadOnlyDemoError, assertDemoWritable, isReadOnlyDemo } from "../src/server/demo-access";
import { createProject } from "../src/server/services/projects";
import { createRelease } from "../src/server/services/releases";
import { addReleaseItem, editReleaseItem, removeReleaseItem } from "../src/server/services/release-items";
import { saveChecklistItem, saveRollbackPlan } from "../src/server/services/checklist";
import { transitionReleaseStatus } from "../src/server/services/lifecycle";

afterEach(() => vi.unstubAllEnvs());

describe("production demo access", () => {
  it("is read-only by default and requires an explicit write opt-in", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ALLOW_UNAUTHENTICATED_WRITES", "");
    expect(isReadOnlyDemo()).toBe(true);
    expect(() => assertDemoWritable()).toThrow(ReadOnlyDemoError);

    vi.stubEnv("ALLOW_UNAUTHENTICATED_WRITES", "true");
    expect(isReadOnlyDemo()).toBe(false);
    expect(() => assertDemoWritable()).not.toThrow();
  });

  it("blocks every mutation service before accessing the database", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ALLOW_UNAUTHENTICATED_WRITES", "");
    const item = { externalReference: "DEMO-1", title: "Example", type: "BUG" as const, status: "TODO" as const, notes: null };

    await expect(createProject({ name: "Example", slug: "example", description: null })).rejects.toBeInstanceOf(ReadOnlyDemoError);
    await expect(createRelease({ projectId: "project-id", version: "v1", title: "Example", description: null, targetDeploymentDate: null, rollbackNotes: null })).rejects.toBeInstanceOf(ReadOnlyDemoError);
    await expect(addReleaseItem("release-id", item)).rejects.toBeInstanceOf(ReadOnlyDemoError);
    await expect(editReleaseItem("release-id", "item-id", item)).rejects.toBeInstanceOf(ReadOnlyDemoError);
    await expect(removeReleaseItem("release-id", "item-id")).rejects.toBeInstanceOf(ReadOnlyDemoError);
    await expect(saveChecklistItem("release-id", { kind: ChecklistKind.QA_VALIDATED, isComplete: true, changeRequired: null, notes: null })).rejects.toBeInstanceOf(ReadOnlyDemoError);
    await expect(saveRollbackPlan("release-id", "Restore the previous image.")).rejects.toBeInstanceOf(ReadOnlyDemoError);
    await expect(transitionReleaseStatus("release-id", { nextStatus: ReleaseStatus.IN_REVIEW, notes: null })).rejects.toBeInstanceOf(ReadOnlyDemoError);
  });

  it("keeps local development writable", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("ALLOW_UNAUTHENTICATED_WRITES", "");
    expect(isReadOnlyDemo()).toBe(false);
  });
});
