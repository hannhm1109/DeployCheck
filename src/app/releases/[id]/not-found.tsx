import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ReleaseNotFound() {
  return (
    <main className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
      <h1 className="text-2xl font-semibold text-[#172d27]">Release not found</h1>
      <p className="mt-3 text-sm text-[#64746e]">This release may have been removed.</p>
      <Link href="/releases" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#0d6b57] hover:underline"><ArrowLeft size={16} aria-hidden="true" /> Back to releases</Link>
    </main>
  );
}
