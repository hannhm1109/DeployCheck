"use client";

import { RouteError } from "@/components/feedback/route-error";

export default function AppError({ reset }: { reset: () => void }) {
  return <RouteError title="This page could not be loaded" reset={reset} />;
}
