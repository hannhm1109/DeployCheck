import Link from "next/link";
import { connection } from "next/server";
import { ArrowLeft } from "lucide-react";
import { ProjectForm } from "@/features/projects/project-form";
import { isReadOnlyDemo } from "@/server/demo-access";

export default async function NewProjectPage() {
  await connection();
  const readOnly = isReadOnlyDemo();
  return (
    <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <Link
        href="/projects"
        className="inline-flex items-center gap-2 text-sm font-medium text-[#60736a] hover:text-[#0d6b57] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f7663]"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Projects
      </Link>
      <div className="mt-8 max-w-2xl">
        <h1 className="text-[30px] font-semibold leading-tight text-[#152923]">
          New project
        </h1>
        {readOnly ? (
          <p className="mt-9 border-y border-[#d9e2dd] py-10 text-sm text-[#64746e]">This demo is read-only. Run the app locally to create projects.</p>
        ) : <ProjectForm />}
      </div>
    </main>
  );
}
