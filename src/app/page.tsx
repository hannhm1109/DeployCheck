import Link from "next/link";
import { connection } from "next/server";
import { ArrowRight, ArrowUpRight, CalendarDays, FolderKanban, Plus, Rocket, ShieldCheck } from "lucide-react";
import { DeploymentResultBadge } from "@/features/deployments/deployment-result-badge";
import { ReleaseStatusBadge } from "@/features/releases/status-badge";
import { formatDate, formatDateTime } from "@/lib/format-date";
import { getOverview } from "@/server/data/overview";
import { isReadOnlyDemo } from "@/server/demo-access";

export default async function Home() {
  await connection();
  const overview = await getOverview();
  const readOnly = isReadOnlyDemo();
  const metrics = [
    { label: "Projects", value: overview.projectCount, href: "/projects", icon: FolderKanban, color: "text-[#2f657c]" },
    { label: "Upcoming releases", value: overview.upcomingCount, href: "/releases", icon: CalendarDays, color: "text-[#9b6823]" },
    { label: "Ready to deploy", value: overview.readyCount, href: "/releases", icon: ShieldCheck, color: "text-[#19704f]" },
    { label: "Deployments (30d)", value: overview.recentDeploymentCount, href: "/deployments", icon: Rocket, color: "text-[#765b83]" },
  ];

  return (
    <main className="mx-auto max-w-7xl px-5 py-9 sm:px-8 sm:py-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="text-[32px] font-semibold leading-tight text-[#192822]">Overview</h1>
          <p className="mt-1.5 text-sm text-[#607269]">Release activity across your projects</p>
        </div>
        {!readOnly && <Link href={overview.projectCount ? "/releases/new" : "/projects/new"} className="inline-flex h-10 items-center gap-2 rounded-[6px] bg-[#0b7059] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#075540] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b7059]"><Plus size={16} aria-hidden="true" />{overview.projectCount ? "New release" : "New project"}</Link>}
      </div>
      <section aria-label="Overview counts" className="grid grid-cols-2 border border-[#dce5df] bg-white lg:grid-cols-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return <Link key={metric.label} href={metric.href} className={`group min-w-0 px-4 py-5 transition-colors hover:bg-[#f3f8f5] focus-visible:outline-2 focus-visible:outline-[#0b7059] sm:px-6 sm:py-6 ${index % 2 === 1 ? "border-l border-[#e5ebe7]" : ""} ${index > 1 ? "border-t border-[#e5ebe7] lg:border-t-0" : ""} ${index === 2 ? "lg:border-l lg:border-[#e5ebe7]" : ""}`}>
            <span className="flex items-center justify-between gap-2"><span className="min-w-0 text-xs font-semibold text-[#607269] sm:text-[13px]">{metric.label}</span><Icon size={17} className={`shrink-0 ${metric.color}`} strokeWidth={1.8} aria-hidden="true" /></span>
            <span className="mt-3 block text-[34px] font-semibold tabular-nums leading-none text-[#192822]">{metric.value}</span>
          </Link>;
        })}
      </section>
      <div className="mt-11 grid gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.9fr)] lg:gap-8">
        <section aria-labelledby="recent-releases-heading" className="min-w-0">
          <div className="mb-4 flex items-center justify-between gap-4"><h2 id="recent-releases-heading" className="text-lg font-semibold text-[#192822]">Recent releases</h2><Link href="/releases" className="inline-flex items-center gap-1 text-sm font-semibold text-[#0b7059] hover:underline">View all <ArrowRight size={15} aria-hidden="true" /></Link></div>
          {overview.recentReleases.length ? (
            <ul className="divide-y divide-[#e5ebe7] border border-[#dce5df] bg-white">
              {overview.recentReleases.map((release) => <li key={release.id}>
                <Link href={`/releases/${release.id}`} className="grid min-h-20 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 transition-colors hover:bg-[#f3f8f5] focus-visible:outline-2 focus-visible:outline-[#0b7059] sm:grid-cols-[minmax(0,1fr)_auto_110px_18px] sm:px-5">
                  <span className="min-w-0"><span className="block truncate text-sm font-semibold text-[#1b3029]">{release.project.name} <span className="ml-1 font-mono text-xs text-[#0b7059]">{release.version}</span></span><span className="mt-1 block truncate text-xs text-[#607269]">{release.title}</span></span>
                  <ReleaseStatusBadge status={release.status} />
                  <span className="hidden text-right text-xs text-[#607269] sm:block">{release.targetDeploymentDate ? formatDate(release.targetDeploymentDate) : "No target"}</span>
                  <ArrowUpRight size={16} className="hidden text-[#81958a] sm:block" aria-hidden="true" />
                </Link>
              </li>)}
            </ul>
          ) : <div className="border-y border-[#d9e2dd] py-10"><p className="text-sm text-[#64746e]">No releases yet.</p>{!readOnly && <Link href={overview.projectCount ? "/releases/new" : "/projects/new"} className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[#0d6b57] hover:underline">{overview.projectCount ? "Create a release" : "Create a project first"} <ArrowUpRight size={15} aria-hidden="true" /></Link>}</div>}
        </section>
        <section aria-labelledby="recent-deployments-heading" className="min-w-0">
          <div className="mb-4 flex items-center justify-between gap-4"><h2 id="recent-deployments-heading" className="text-lg font-semibold text-[#192822]">Recent deployments</h2><Link href="/deployments" className="inline-flex items-center gap-1 text-sm font-semibold text-[#0b7059] hover:underline">View history <ArrowRight size={15} aria-hidden="true" /></Link></div>
          {overview.recentDeployments.length ? (
            <ul className="divide-y divide-[#e5ebe7] border border-[#dce5df] bg-white">{overview.recentDeployments.map((deployment) => <li key={deployment.id}><Link href={`/releases/${deployment.release.id}`} className="flex min-h-20 items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-[#f3f8f5] focus-visible:outline-2 focus-visible:outline-[#0b7059] sm:px-5"><span className="min-w-0"><span className="block truncate text-sm font-semibold text-[#1b3029]">{deployment.release.project.name} <span className="ml-1 font-mono text-xs text-[#0b7059]">{deployment.release.version}</span></span><span className="mt-1 block truncate text-xs text-[#607269]">{formatDateTime(deployment.occurredAt)}</span></span><DeploymentResultBadge result={deployment.result} /></Link></li>)}</ul>
          ) : <div className="border-y border-[#d9e2dd] py-10"><p className="text-sm text-[#64746e]">No deployments recorded yet.</p><p className="mt-2 text-xs text-[#64746e]">Outcomes appear here when a release is deployed, fails, or is rolled back.</p></div>}
        </section>
      </div>
    </main>
  );
}
