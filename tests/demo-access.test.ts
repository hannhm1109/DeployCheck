import { afterEach, describe, expect, it, vi } from "vitest";
import { ChecklistKind, ReleaseStatus } from "../src/generated/prisma/enums";
import { ReadOnlyDemoError, assertDemoWritable, isReadOnlyDemo } from "../src/server/demo-access";
import { createProject } from "../src/server/services/projects";
import { createRelease } from "../src/server/services/releases";
import { addReleaseItem, editReleaseItem, removeReleaseItem } from "../src/server/services/release-items";
import { saveChecklistItem, saveRollbackPlan } from "../src/server/services/checklist";
import { transitionReleaseStatus } from "../src/server/services/lifecycle";

afterEach(() => vi.unstubAllEnvs());

describe("demo access", () => {
  it("is writable by default and requires an explicit read-only opt-in", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("READ_ONLY_DEMO", "");
    expect(isReadOnlyDemo()).toBe(false);
    expect(() => assertDemoWritable()).not.toThrow();

    vi.stubEnv("READ_ONLY_DEMO", "true");
    expect(isReadOnlyDemo()).toBe(true);
    expect(() => assertDemoWritable()).toThrow(ReadOnlyDemoError);
  });

  it("blocks every mutation service before accessing the database", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("READ_ONLY_DEMO", "true");
    const item = { externalReference: "DEMO-1", title: "Example", type: "BUG" as const, status: "TODO" as const, notes: null };

    await expect(createProject("workspace-id", { name: "Example", slug: "example", description: null })).rejects.toBeInstanceOf(ReadOnlyDemoError);
    await expect(createRelease("workspace-id", { projectId: "project-id", version: "v1", title: "Example", description: null, targetDeploymentDate: null, rollbackNotes: null })).rejects.toBeInstanceOf(ReadOnlyDemoError);
    await expect(addReleaseItem("workspace-id", "release-id", item)).rejects.toBeInstanceOf(ReadOnlyDemoError);
    await expect(editReleaseItem("workspace-id", "release-id", "item-id", item)).rejects.toBeInstanceOf(ReadOnlyDemoError);
    await expect(removeReleaseItem("workspace-id", "release-id", "item-id")).rejects.toBeInstanceOf(ReadOnlyDemoError);
    await expect(saveChecklistItem("workspace-id", "release-id", { kind: ChecklistKind.QA_VALIDATED, isComplete: true, changeRequired: null, notes: null })).rejects.toBeInstanceOf(ReadOnlyDemoError);
    await expect(saveRollbackPlan("workspace-id", "release-id", "Restore the previous image.")).rejects.toBeInstanceOf(ReadOnlyDemoError);
    await expect(transitionReleaseStatus("workspace-id", "release-id", { nextStatus: ReleaseStatus.IN_REVIEW, notes: null })).rejects.toBeInstanceOf(ReadOnlyDemoError);
  });

  it("keeps local development writable", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("READ_ONLY_DEMO", "");
    expect(isReadOnlyDemo()).toBe(false);
  });
});
