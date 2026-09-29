import { DeploymentResult, ReleaseStatus } from "@/generated/prisma/enums";
import { calculateReleaseReadiness } from "@/lib/domain/releases/readiness";
import { getTransitionError } from "@/lib/domain/releases/transitions";
import type { TransitionInput } from "@/lib/validation/lifecycle";
import {
  getReleaseForTransition,
  insertDeploymentOutcome,
  updateReleaseStatus,
} from "@/server/data/lifecycle";
import { runSerializableTransaction } from "@/server/services/release-write";
import { assertDemoWritable } from "@/server/demo-access";

export class ReleaseTransitionNotFoundError extends Error {
  constructor() {
    super("This release no longer exists.");
  }
}

export class ReleaseTransitionRejectedError extends Error {}

const outcomeForStatus: Partial<Record<ReleaseStatus, DeploymentResult>> = {
  DEPLOYED: DeploymentResult.SUCCEEDED,
  FAILED: DeploymentResult.FAILED,
  ROLLED_BACK: DeploymentResult.ROLLED_BACK,
};

export async function transitionReleaseStatus(releaseId: string, input: TransitionInput) {
  assertDemoWritable();
  return runSerializableTransaction(async (tx) => {
    const release = await getReleaseForTransition(tx, releaseId);
    if (!release) throw new ReleaseTransitionNotFoundError();

    const occurredAt = new Date();
    const readiness = calculateReleaseReadiness(release);
    const deployedAt = input.nextStatus === ReleaseStatus.DEPLOYED
      ? occurredAt
      : release.deployedAt;
    const error = getTransitionError(release.status, input.nextStatus, {
      isReady: readiness.isReady,
      deployedAt,
    });
    if (error) throw new ReleaseTransitionRejectedError(error);

    const updated = await updateReleaseStatus(
      tx,
      releaseId,
      release.status,
      input.nextStatus,
      deployedAt,
    );
    if (updated.count !== 1) {
      throw new ReleaseTransitionRejectedError("The release changed. Refresh and try again.");
    }

    const outcome = outcomeForStatus[input.nextStatus];
    if (outcome) {
      await insertDeploymentOutcome(tx, releaseId, outcome, occurredAt, input.notes);
    }
    return { status: input.nextStatus, deployedAt, projectSlug: release.project.slug };
  });
}
