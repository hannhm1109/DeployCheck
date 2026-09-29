import { ReleaseStatus } from "@/generated/prisma/enums";

export function canEditReleaseContent(status: ReleaseStatus): boolean {
  return status === ReleaseStatus.DRAFT || status === ReleaseStatus.IN_REVIEW;
}
