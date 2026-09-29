"use client";

import { RotateCcw } from "lucide-react";

export function RouteError({ title, reset }: { title: string; reset: () => void }) {
  return (
    <main className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
      <h1 className="text-2xl font-semibold text-[#172d27]">{title}</h1>
      <p className="mt-3 text-sm text-[#64746e]">Please try again.</p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 inline-flex h-10 items-center gap-2 rounded-[6px] bg-[#0d6b57] px-4 text-sm font-medium text-white hover:bg-[#095442] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0d6b57]"
      >
        <RotateCcw size={16} aria-hidden="true" />
        Retry
      </button>
    </main>
  );
}
