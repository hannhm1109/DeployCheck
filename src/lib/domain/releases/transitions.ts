import { ReleaseStatus } from "../../../generated/prisma/enums";

const NEXT_STATUSES: Record<ReleaseStatus, readonly ReleaseStatus[]> = {
  DRAFT: [ReleaseStatus.IN_REVIEW],
  IN_REVIEW: [ReleaseStatus.DRAFT, ReleaseStatus.READY],
  READY: [ReleaseStatus.IN_REVIEW, ReleaseStatus.DEPLOYING],
  DEPLOYING: [ReleaseStatus.DEPLOYED, ReleaseStatus.FAILED],
  DEPLOYED: [ReleaseStatus.ROLLED_BACK],
  FAILED: [ReleaseStatus.ROLLED_BACK],
  ROLLED_BACK: [],
};

export type TransitionContext = {
  isReady: boolean;
  deployedAt: Date | null;
};

export function canTransitionReleaseStatus(
  current: ReleaseStatus,
  next: ReleaseStatus,
  context: TransitionContext,
): boolean {
  if (!NEXT_STATUSES[current].includes(next)) {
    return false;
  }

  if (
    (next === ReleaseStatus.READY || next === ReleaseStatus.DEPLOYING) &&
    !context.isReady
  ) {
    return false;
  }

  if (next === ReleaseStatus.DEPLOYED && !context.deployedAt) {
    return false;
  }

  return true;
}
