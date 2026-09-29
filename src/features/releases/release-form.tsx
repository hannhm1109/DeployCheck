"use client";

import Link from "next/link";
import { useActionState } from "react";
import { LoaderCircle, Plus } from "lucide-react";
import { createReleaseAction } from "@/server/actions/releases";
import type { ReleaseFormState, ReleaseFormValues } from "@/lib/validation/releases";

type ProjectOption = { id: string; name: string; slug: string };

const inputClassName =
  "mt-2 block h-11 w-full rounded-[6px] border border-[#cbd8d1] bg-white px-3 text-sm text-[#1d2925] outline-none transition-colors placeholder:text-[#9ba9a1] focus:border-[#0d6b57] focus:ring-2 focus:ring-[#c8e9db] aria-invalid:border-[#c44d4d] aria-invalid:focus:ring-[#f8d8d4]";

const textareaClassName =
  "mt-2 block w-full resize-y rounded-[6px] border border-[#cbd8d1] bg-white px-3 py-3 text-sm text-[#1d2925] outline-none transition-colors placeholder:text-[#9ba9a1] focus:border-[#0d6b57] focus:ring-2 focus:ring-[#c8e9db] aria-invalid:border-[#c44d4d]";

export function ReleaseForm({
  projects,
  selectedProjectId = "",
}: {
  projects: ProjectOption[];
  selectedProjectId?: string;
}) {
  const initialState: ReleaseFormState = {
    values: {
      projectId: selectedProjectId,
      version: "",
      title: "",
      description: "",
      targetDeploymentDate: "",
      rollbackNotes: "",
    },
    errors: {},
  };
  const [state, formAction, pending] = useActionState(createReleaseAction, initialState);

  function errorFor(field: keyof ReleaseFormValues) {
    return state.errors[field] ? (
      <p id={`${field}-error`} className="mt-2 text-sm text-[#a13e3b]" role="alert">
        {state.errors[field]}
      </p>
    ) : null;
  }

  return (
    <form action={formAction} noValidate className="mt-9 border-t border-[#d9e2dd]">
      <div className="py-5">
        <label htmlFor="projectId" className="block text-sm font-semibold text-[#243930]">Project</label>
        <select id="projectId" name="projectId" defaultValue={state.values.projectId} aria-invalid={Boolean(state.errors.projectId)} aria-describedby={state.errors.projectId ? "projectId-error" : undefined} className={inputClassName}>
          <option value="">Choose a project</option>
          {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
        </select>
        {errorFor("projectId")}
      </div>
      <div className="border-t border-[#e2e9e5] py-5">
        <label htmlFor="version" className="block text-sm font-semibold text-[#243930]">Version</label>
        <input id="version" name="version" type="text" autoComplete="off" maxLength={40} defaultValue={state.values.version} aria-invalid={Boolean(state.errors.version)} aria-describedby={state.errors.version ? "version-error" : undefined} placeholder="v1.2.0" className={`${inputClassName} font-mono`} />
        {errorFor("version")}
      </div>
      <div className="border-t border-[#e2e9e5] py-5">
        <label htmlFor="title" className="block text-sm font-semibold text-[#243930]">Title</label>
        <input id="title" name="title" type="text" autoComplete="off" maxLength={120} defaultValue={state.values.title} aria-invalid={Boolean(state.errors.title)} aria-describedby={state.errors.title ? "title-error" : undefined} placeholder="Autumn storefront update" className={inputClassName} />
        {errorFor("title")}
      </div>
      <div className="border-t border-[#e2e9e5] py-5">
        <label htmlFor="description" className="block text-sm font-semibold text-[#243930]">Description <span className="font-normal text-[#64746e]">(optional)</span></label>
        <textarea id="description" name="description" rows={4} maxLength={1000} defaultValue={state.values.description} aria-invalid={Boolean(state.errors.description)} aria-describedby={state.errors.description ? "description-error" : undefined} placeholder="What is included in this release?" className={textareaClassName} />
        {errorFor("description")}
      </div>
      <div className="border-t border-[#e2e9e5] py-5">
        <label htmlFor="targetDeploymentDate" className="block text-sm font-semibold text-[#243930]">Target deployment date <span className="font-normal text-[#64746e]">(optional)</span></label>
        <input id="targetDeploymentDate" name="targetDeploymentDate" type="date" defaultValue={state.values.targetDeploymentDate} aria-invalid={Boolean(state.errors.targetDeploymentDate)} aria-describedby={state.errors.targetDeploymentDate ? "targetDeploymentDate-error" : undefined} className={inputClassName} />
        {errorFor("targetDeploymentDate")}
      </div>
      <div className="border-y border-[#e2e9e5] py-5">
        <label htmlFor="rollbackNotes" className="block text-sm font-semibold text-[#243930]">Rollback plan <span className="font-normal text-[#64746e]">(optional)</span></label>
        <textarea id="rollbackNotes" name="rollbackNotes" rows={4} maxLength={2000} defaultValue={state.values.rollbackNotes} aria-invalid={Boolean(state.errors.rollbackNotes)} aria-describedby={state.errors.rollbackNotes ? "rollbackNotes-error" : undefined} placeholder="Steps to restore the previous version" className={textareaClassName} />
        {errorFor("rollbackNotes")}
      </div>
      <div className="flex flex-wrap items-center justify-end gap-4 pt-6">
        {state.message && <p className="w-full text-sm text-[#a13e3b]" role="alert">{state.message}</p>}
        <Link href="/releases" className="inline-flex h-10 items-center px-2 text-sm font-medium text-[#5b6c63] hover:text-[#1d2925] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f7663]">Cancel</Link>
        <button type="submit" disabled={pending} className="inline-flex h-10 w-40 items-center justify-center gap-2 rounded-[6px] bg-[#0d6b57] px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#095442] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0d6b57] disabled:cursor-wait disabled:opacity-65">
          {pending ? <LoaderCircle size={16} className="animate-spin" aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}
          {pending ? "Creating..." : "Create release"}
        </button>
      </div>
    </form>
  );
}
