import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProjectForm } from "@/features/projects/project-form";

export default function NewProjectPage() {
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
        <ProjectForm />
      </div>
    </main>
  );
}
