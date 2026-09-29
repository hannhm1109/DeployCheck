"use client";

import { RouteError } from "@/components/feedback/route-error";

export default function ReleasesError({ reset }: { reset: () => void }) {
  return <RouteError title="Releases could not be loaded" reset={reset} />;
}
