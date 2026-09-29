import Link from "next/link";
import { connection } from "next/server";
import { ArrowUpRight, Plus } from "lucide-react";
import { DeploymentResultBadge } from "@/features/deployments/deployment-result-badge";
import { ReleaseStatusBadge } from "@/features/releases/status-badge";
import { formatDate, formatDateTime } from "@/lib/format-date";
import { getOverview } from "@/server/data/overview";

export default async function Home() {
  await connection();
  const overview = await getOverview();
  const metrics = [
    { label: "Projects", value: overview.projectCount, href: "/projects" },
    { label: "Upcoming releases", value: overview.upcomingCount, href: "/releases" },
    { label: "Ready to deploy", value: overview.readyCount, href: "/releases" },
    { label: "Deployments (30d)", value: overview.recentDeploymentCount, href: "/deployments" },
  ];

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="mb-9 flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="text-[30px] font-semibold leading-tight text-[#152923]">Overview</h1>
          <p className="mt-2 text-sm text-[#64746e]">Release activity across your projects</p>
        </div>
        <Link href={overview.projectCount ? "/releases/new" : "/projects/new"} className="inline-flex h-10 items-center gap-2 rounded-[6px] bg-[#0d6b57] px-4 text-sm font-medium text-white hover:bg-[#095442] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0d6b57]"><Plus size={16} aria-hidden="true" />{overview.projectCount ? "New release" : "New project"}</Link>
      </div>
      <section aria-label="Overview counts" className="grid grid-cols-2 border-y border-[#d9e2dd] lg:grid-cols-4">
        {metrics.map((metric) => (
          <Link key={metric.label} href={metric.href} className="group min-w-0 border-b border-[#e2e9e5] px-4 py-5 transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-[#0f7663] even:border-l lg:border-b-0 lg:border-l lg:first:border-l-0">
            <span className="block text-xs font-medium text-[#64746e]">{metric.label}</span>
            <span className="mt-2 block text-[28px] font-semibold tabular-nums leading-none text-[#1b3029]">{metric.value}</span>
          </Link>
        ))}
      </section>
      <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.85fr)]">
        <section aria-labelledby="recent-releases-heading" className="min-w-0">
          <div className="mb-4 flex items-center justify-between gap-4"><h2 id="recent-releases-heading" className="text-lg font-semibold text-[#1b3029]">Recent releases</h2><Link href="/releases" className="text-sm font-medium text-[#0d6b57] hover:underline">View all</Link></div>
          {overview.recentReleases.length ? (
            <ul className="divide-y divide-[#e2e9e5] border-y border-[#d9e2dd]">
              {overview.recentReleases.map((release) => <li key={release.id}>
                <Link href={`/releases/${release.id}`} className="grid min-h-20 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 py-3 hover:bg-white focus-visible:outline-2 focus-visible:outline-[#0f7663] sm:grid-cols-[minmax(0,1fr)_auto_110px_18px]">
                  <span className="min-w-0"><span className="block truncate font-mono text-sm font-semibold text-[#1c4033]">{release.version}</span><span className="mt-1 block truncate text-xs text-[#64746e]">{release.project.name} / {release.title}</span></span>
                  <ReleaseStatusBadge status={release.status} />
                  <span className="hidden text-right text-xs text-[#64746e] sm:block">{release.targetDeploymentDate ? formatDate(release.targetDeploymentDate) : "No target"}</span>
                  <ArrowUpRight size={16} className="hidden text-[#81958a] sm:block" aria-hidden="true" />
                </Link>
              </li>)}
            </ul>
          ) : <div className="border-y border-[#d9e2dd] py-10"><p className="text-sm text-[#64746e]">No releases yet.</p><Link href={overview.projectCount ? "/releases/new" : "/projects/new"} className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[#0d6b57] hover:underline">{overview.projectCount ? "Create a release" : "Create a project first"} <ArrowUpRight size={15} aria-hidden="true" /></Link></div>}
        </section>
        <section aria-labelledby="recent-deployments-heading" className="min-w-0">
          <div className="mb-4 flex items-center justify-between gap-4"><h2 id="recent-deployments-heading" className="text-lg font-semibold text-[#1b3029]">Recent deployments</h2><Link href="/deployments" className="text-sm font-medium text-[#0d6b57] hover:underline">View history</Link></div>
          {overview.recentDeployments.length ? (
            <ul className="divide-y divide-[#e2e9e5] border-y border-[#d9e2dd]">{overview.recentDeployments.map((deployment) => <li key={deployment.id}><Link href={`/releases/${deployment.release.id}`} className="flex min-h-20 items-center justify-between gap-3 px-3 py-3 hover:bg-white focus-visible:outline-2 focus-visible:outline-[#0f7663]"><span className="min-w-0"><span className="block truncate font-mono text-sm font-semibold text-[#1c4033]">{deployment.release.version}</span><span className="mt-1 block truncate text-xs text-[#64746e]">{deployment.release.project.name} / {formatDateTime(deployment.occurredAt)}</span></span><DeploymentResultBadge result={deployment.result} /></Link></li>)}</ul>
          ) : <div className="border-y border-[#d9e2dd] py-10"><p className="text-sm text-[#64746e]">No deployments recorded yet.</p><p className="mt-2 text-xs text-[#64746e]">Outcomes appear here when a release is deployed, fails, or is rolled back.</p></div>}
        </section>
      </div>
    </main>
  );
}
