import Link from "next/link";
import { connection } from "next/server";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { DeploymentResult } from "@/generated/prisma/enums";
import { DeploymentResultBadge } from "@/features/deployments/deployment-result-badge";
import { formatDateTime } from "@/lib/format-date";
import { listDeploymentHistory } from "@/server/data/deployments";

type Query = { page?: string | string[]; result?: string | string[]; release?: string | string[] };

function historyUrl(page: number, result?: DeploymentResult, releaseId?: string) {
  const params = new URLSearchParams();
  if (result) params.set("result", result);
  if (releaseId) params.set("release", releaseId);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return `/deployments${query ? `?${query}` : ""}`;
}

export default async function DeploymentsPage({ searchParams }: { searchParams: Promise<Query> }) {
  await connection();
  const query = await searchParams;
  const result = Object.values(DeploymentResult).includes(query.result as DeploymentResult)
    ? query.result as DeploymentResult
    : undefined;
  const releaseId = typeof query.release === "string" && query.release.length <= 100 ? query.release : undefined;
  const pageInput = typeof query.page === "string" && /^[1-9]\d{0,5}$/.test(query.page) ? Number(query.page) : 1;
  const { deployments, total, pageCount, page } = await listDeploymentHistory({ page: pageInput, result, releaseId });
  const release = deployments[0]?.release;
  const filters: { label: string; value?: DeploymentResult }[] = [
    { label: "All" },
    { label: "Succeeded", value: DeploymentResult.SUCCEEDED },
    { label: "Failed", value: DeploymentResult.FAILED },
    { label: "Rolled back", value: DeploymentResult.ROLLED_BACK },
  ];

  return (
    <main className="mx-auto max-w-7xl px-5 py-9 sm:px-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-[32px] font-semibold leading-tight text-[#192822]">Deployment history</h1>
        <p className="mt-1.5 text-sm text-[#607269]">{total} {total === 1 ? "outcome" : "outcomes"}{releaseId && release ? ` for ${release.project.name} ${release.version}` : ""}</p>
        {releaseId && <Link href="/deployments" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[#0d6b57] hover:underline"><ArrowLeft size={15} aria-hidden="true" /> All deployments</Link>}
      </div>
      <nav aria-label="Filter by outcome" className="mb-6 flex flex-wrap gap-1 border-b border-[#dce5df]">
        {filters.map((filter) => <Link key={filter.label} href={historyUrl(1, filter.value, releaseId)} aria-current={result === filter.value ? "page" : undefined} className={`inline-flex h-10 items-center border-b-2 px-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f7663] ${result === filter.value ? "border-[#0b7059] text-[#174c3d]" : "border-transparent text-[#607269] hover:text-[#174c3d]"}`}>{filter.label}</Link>)}
      </nav>
      {deployments.length ? (
        <section aria-label="Deployment outcomes">
          <div className="hidden grid-cols-[minmax(0,1fr)_minmax(0,1fr)_145px_115px] gap-5 border-x border-t border-[#dce5df] bg-[#eef3f0] px-5 py-3 text-[11px] font-semibold uppercase text-[#607269] md:grid"><span>Release</span><span>Notes</span><span>Occurred</span><span>Outcome</span></div>
          <ul className="divide-y divide-[#e5ebe7] border border-[#dce5df] bg-white">
            {deployments.map((entry) => <li key={entry.id}><Link href={`/releases/${entry.release.id}`} className="grid min-h-20 grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-4 transition-colors hover:bg-[#f3f8f5] focus-visible:outline-2 focus-visible:outline-[#0b7059] md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_145px_115px] md:gap-5 md:px-5">
              <span className="min-w-0"><span className="block truncate font-mono text-sm font-semibold text-[#1c4033]">{entry.release.version}</span><span className="mt-1 block truncate text-xs text-[#64746e]">{entry.release.project.name} / {entry.release.title}</span><span className="mt-2 block text-xs text-[#64746e] md:hidden">{formatDateTime(entry.occurredAt)}</span></span>
              <span className="hidden min-w-0 whitespace-pre-wrap break-words text-sm text-[#4e6157] md:block">{entry.notes || "-"}</span>
              <span className="hidden text-xs text-[#64746e] md:block">{formatDateTime(entry.occurredAt)}</span>
              <DeploymentResultBadge result={entry.result} />
              {entry.notes && <span className="col-span-2 whitespace-pre-wrap break-words text-xs text-[#4e6157] md:hidden">{entry.notes}</span>}
            </Link></li>)}
          </ul>
        </section>
      ) : <section className="border-y border-[#d9e2dd] py-14 text-center"><h2 className="text-base font-semibold text-[#1b3029]">No deployment outcomes found</h2><p className="mt-2 text-sm text-[#64746e]">{result || releaseId ? "Try another outcome filter or view all deployments." : "Outcomes appear after a release is deployed, fails, or is rolled back."}</p>{(result || releaseId) && <Link href="/deployments" className="mt-4 inline-block text-sm font-medium text-[#0d6b57] hover:underline">View all deployments</Link>}</section>}
      {pageCount > 1 && <nav aria-label="History pages" className="mt-6 flex items-center justify-between gap-4 text-sm"><span className="text-[#64746e]">Page {page} of {pageCount}</span><span className="flex gap-4">{page > 1 && <Link href={historyUrl(page - 1, result, releaseId)} className="inline-flex items-center gap-1 font-medium text-[#0d6b57] hover:underline"><ArrowLeft size={15} aria-hidden="true" /> Previous</Link>}{page < pageCount && <Link href={historyUrl(page + 1, result, releaseId)} className="inline-flex items-center gap-1 font-medium text-[#0d6b57] hover:underline">Next <ArrowRight size={15} aria-hidden="true" /></Link>}</span></nav>}
    </main>
  );
}
