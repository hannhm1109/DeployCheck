import Link from "next/link";
import { connection } from "next/server";
import { ArrowUpRight, Plus } from "lucide-react";
import { listProjects } from "@/server/data/projects";

export default async function ProjectsPage() {
  await connection();
  const projects = await listProjects();

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="mb-9 flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="text-[30px] font-semibold leading-tight text-[#152923]">
            Projects
          </h1>
          <p className="mt-2 text-sm text-[#64746e]">
            {projects.length} {projects.length === 1 ? "project" : "projects"}
          </p>
        </div>
        <Link
          href="/projects/new"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-[6px] bg-[#0d6b57] px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#095442] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0d6b57]"
        >
          <Plus size={16} strokeWidth={2.2} aria-hidden="true" />
          New project
        </Link>
      </div>

      {projects.length === 0 ? (
        <section className="border-y border-[#d9e2dd] py-16 text-center">
          <h2 className="text-lg font-semibold">No projects yet</h2>
          <p className="mt-2 text-sm text-[#64746e]">Create your first project.</p>
          <Link
            href="/projects/new"
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#0d6b57] underline-offset-4 hover:underline"
          >
            <Plus size={16} aria-hidden="true" />
            New project
          </Link>
        </section>
      ) : (
        <section aria-label="All projects">
          <div className="hidden grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_90px_24px] gap-5 border-y border-[#d9e2dd] px-4 py-3 text-xs font-semibold text-[#667771] md:grid">
            <span>Project</span>
            <span>Slug</span>
            <span>Releases</span>
            <span className="sr-only">Open</span>
          </div>
          <ul className="divide-y divide-[#e2e9e5] border-y border-[#d9e2dd] md:border-t-0">
            {projects.map((project) => (
              <li key={project.id}>
                <Link
                  href={`/projects/${project.slug}`}
                  className="grid min-h-23 grid-cols-[minmax(0,1fr)_auto] items-center gap-5 px-4 py-4 transition-colors hover:bg-white focus-visible:bg-white focus-visible:outline-2 focus-visible:outline-[#0f7663] md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_90px_24px]"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-[#1b3029]">
                      {project.name}
                    </span>
                    {project.description && (
                      <span className="mt-1 block truncate text-sm text-[#687872]">
                        {project.description}
                      </span>
                    )}
                    <span className="mt-1 block truncate font-mono text-xs text-[#76867f] md:hidden">
                      {project.slug}
                    </span>
                  </span>
                  <span className="hidden truncate font-mono text-xs text-[#596b63] md:block">
                    {project.slug}
                  </span>
                  <span className="text-right text-sm tabular-nums text-[#40544b] md:text-left">
                    {project._count.releases}
                    <span className="ml-1 text-xs text-[#829089] md:hidden">releases</span>
                  </span>
                  <ArrowUpRight
                    size={17}
                    className="hidden text-[#81958a] md:block"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
