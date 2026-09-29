import Link from "next/link";
import { connection } from "next/server";
import { ArrowUpRight, Plus } from "lucide-react";
import { ReleaseStatusBadge } from "@/features/releases/status-badge";
import { formatDate } from "@/lib/format-date";
import { listReleases } from "@/server/data/releases";
import { isReadOnlyDemo } from "@/server/demo-access";

export default async function ReleasesPage() {
  await connection();
  const releases = await listReleases();
  const readOnly = isReadOnlyDemo();

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="mb-9 flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="text-[30px] font-semibold leading-tight text-[#152923]">Releases</h1>
          <p className="mt-2 text-sm text-[#64746e]">{releases.length} {releases.length === 1 ? "release" : "releases"}</p>
        </div>
        {!readOnly && <Link href="/releases/new" className="inline-flex h-10 items-center justify-center gap-2 rounded-[6px] bg-[#0d6b57] px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#095442] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0d6b57]">
          <Plus size={16} strokeWidth={2.2} aria-hidden="true" /> New release
        </Link>}
      </div>
      {releases.length === 0 ? (
        <section className="border-y border-[#d9e2dd] py-16 text-center">
          <h2 className="text-lg font-semibold">No releases yet</h2>
          <p className="mt-2 text-sm text-[#64746e]">{readOnly ? "Demo data has not been loaded." : "Create the first release for a project."}</p>
          {!readOnly && <Link href="/releases/new" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#0d6b57] hover:underline"><Plus size={16} aria-hidden="true" /> New release</Link>}
        </section>
      ) : (
        <section aria-label="All releases">
          <div className="hidden grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_105px_125px_24px] gap-5 border-y border-[#d9e2dd] px-4 py-3 text-xs font-semibold text-[#667771] md:grid">
            <span>Release</span><span>Project</span><span>Status</span><span>Target date</span><span className="sr-only">Open</span>
          </div>
          <ul className="divide-y divide-[#e2e9e5] border-y border-[#d9e2dd] md:border-t-0">
            {releases.map((release) => (
              <li key={release.id}>
                <Link href={`/releases/${release.id}`} className="grid min-h-23 grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-4 transition-colors hover:bg-white focus-visible:bg-white focus-visible:outline-2 focus-visible:outline-[#0f7663] md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_105px_125px_24px] md:gap-5">
                  <span className="min-w-0"><span className="block truncate font-mono text-sm font-semibold text-[#1c4033]">{release.version}</span><span className="mt-1 block truncate text-sm text-[#65766d]">{release.title}</span><span className="mt-1 block truncate text-xs text-[#76877d] md:hidden">{release.project.name}</span></span>
                  <span className="hidden truncate text-sm text-[#40544b] md:block">{release.project.name}</span>
                  <ReleaseStatusBadge status={release.status} />
                  <span className="hidden whitespace-nowrap text-sm text-[#63746b] md:block">{release.targetDeploymentDate ? formatDate(release.targetDeploymentDate) : "Not set"}</span>
                  <ArrowUpRight size={17} className="hidden text-[#81958a] md:block" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
