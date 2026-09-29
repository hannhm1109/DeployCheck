import { ReleaseStatus } from "@/generated/prisma/enums";

export const EDITABLE_RELEASE_STATUSES = [
  ReleaseStatus.DRAFT,
  ReleaseStatus.IN_REVIEW,
] as const;

export function canEditReleaseContent(status: ReleaseStatus): boolean {
  return EDITABLE_RELEASE_STATUSES.some((editable) => editable === status);
}
