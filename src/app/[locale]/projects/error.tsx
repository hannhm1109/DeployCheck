"use client";

import { RouteError } from "@/components/feedback/route-error";

export default function ProjectsError({ reset }: { reset: () => void }) {
  return <RouteError titleKey="project" reset={reset} />;
}
