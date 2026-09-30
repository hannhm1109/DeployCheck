"use client";

import { RouteError } from "@/components/feedback/route-error";

export default function ReleasesError({ reset }: { reset: () => void }) {
  return <RouteError titleKey="release" reset={reset} />;
}
