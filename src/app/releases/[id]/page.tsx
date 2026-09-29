import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ArrowLeft } from "lucide-react";
import { ReleaseStatusBadge } from "@/features/releases/status-badge";
import { formatDate } from "@/lib/format-date";
import { getReleaseById } from "@/server/data/releases";

export default async function ReleaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;
  const release = await getReleaseById(id);
  if (!release) notFound();

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <Link href="/releases" className="inline-flex items-center gap-2 text-sm font-medium text-[#60736a] hover:text-[#0d6b57] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f7663]">
        <ArrowLeft size={16} aria-hidden="true" /> Releases
      </Link>
      <header className="mt-8 border-b border-[#d9e2dd] pb-8">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="break-all font-mono text-[30px] font-semibold leading-tight text-[#152923]">{release.version}</h1>
          <ReleaseStatusBadge status={release.status} />
        </div>
        <p className="mt-3 break-words text-lg text-[#32473b]">{release.title}</p>
        <Link href={`/projects/${release.project.slug}`} className="mt-4 inline-block text-sm font-medium text-[#0d6b57] hover:underline">{release.project.name}</Link>
      </header>
      <div className="grid gap-10 pt-8 lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-12">
        <div className="min-w-0 space-y-9">
          <section aria-labelledby="description-heading">
            <h2 id="description-heading" className="text-lg font-semibold text-[#1b3029]">Description</h2>
            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-[#4e6157]">{release.description || "No description added."}</p>
          </section>
          <section aria-labelledby="rollback-heading" className="border-t border-[#e2e9e5] pt-8">
            <h2 id="rollback-heading" className="text-lg font-semibold text-[#1b3029]">Rollback plan</h2>
            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-[#4e6157]">{release.rollbackNotes || "No rollback plan added."}</p>
          </section>
        </div>
        <aside className="border-t border-[#d9e2dd] pt-6 lg:border-t-0 lg:border-l lg:pl-8 lg:pt-0">
          <h2 className="text-sm font-semibold text-[#263b31]">Release details</h2>
          <dl className="mt-5 space-y-5 text-sm">
            <div><dt className="text-[#74857b]">Target deployment</dt><dd className="mt-1 font-medium text-[#2a3d33]">{release.targetDeploymentDate ? formatDate(release.targetDeploymentDate) : "Not set"}</dd></div>
            <div><dt className="text-[#74857b]">Deployed</dt><dd className="mt-1 font-medium text-[#2a3d33]">{release.deployedAt ? formatDate(release.deployedAt) : "Not deployed"}</dd></div>
            <div><dt className="text-[#74857b]">Created</dt><dd className="mt-1 font-medium text-[#2a3d33]">{formatDate(release.createdAt)}</dd></div>
            <div><dt className="text-[#74857b]">Last updated</dt><dd className="mt-1 font-medium text-[#2a3d33]">{formatDate(release.updatedAt)}</dd></div>
          </dl>
        </aside>
      </div>
    </main>
  );
}
