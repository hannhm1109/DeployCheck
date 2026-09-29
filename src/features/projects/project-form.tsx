"use client";

import Link from "next/link";
import { useActionState } from "react";
import { LoaderCircle, Plus } from "lucide-react";
import { createProjectAction } from "@/server/actions/projects";
import type { ProjectFormState } from "@/lib/validation/projects";

const initialState: ProjectFormState = {
  values: { name: "", slug: "", description: "" },
  errors: {},
};

const inputClassName =
  "mt-2 block h-11 w-full rounded-[6px] border border-[#cbd8d1] bg-white px-3 text-sm text-[#1d2925] outline-none transition-colors placeholder:text-[#9ba9a1] focus:border-[#0d6b57] focus:ring-2 focus:ring-[#c8e9db] aria-invalid:border-[#c44d4d] aria-invalid:focus:ring-[#f8d8d4]";

export function ProjectForm() {
  const [state, formAction, pending] = useActionState(
    createProjectAction,
    initialState,
  );

  return (
    <form action={formAction} noValidate className="mt-9 border-t border-[#d9e2dd]">
      <div className="py-5">
        <label htmlFor="name" className="block text-sm font-semibold text-[#243930]">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="off"
          maxLength={80}
          defaultValue={state.values.name}
          aria-invalid={Boolean(state.errors.name)}
          aria-describedby={state.errors.name ? "name-error" : undefined}
          placeholder="Northstar Commerce"
          className={inputClassName}
        />
        {state.errors.name && (
          <p id="name-error" className="mt-2 text-sm text-[#a13e3b]" role="alert">
            {state.errors.name}
          </p>
        )}
      </div>
      <div className="border-t border-[#e2e9e5] py-5">
        <label htmlFor="slug" className="block text-sm font-semibold text-[#243930]">
          Slug
        </label>
        <input
          id="slug"
          name="slug"
          type="text"
          autoComplete="off"
          maxLength={60}
          defaultValue={state.values.slug}
          aria-invalid={Boolean(state.errors.slug)}
          aria-describedby={state.errors.slug ? "slug-error" : undefined}
          placeholder="northstar-commerce"
          className={`${inputClassName} font-mono`}
        />
        {state.errors.slug && (
          <p id="slug-error" className="mt-2 text-sm text-[#a13e3b]" role="alert">
            {state.errors.slug}
          </p>
        )}
      </div>
      <div className="border-y border-[#e2e9e5] py-5">
        <label
          htmlFor="description"
          className="block text-sm font-semibold text-[#243930]"
        >
          Description <span className="font-normal text-[#64746e]">(optional)</span>
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          maxLength={500}
          defaultValue={state.values.description}
          aria-invalid={Boolean(state.errors.description)}
          aria-describedby={state.errors.description ? "description-error" : undefined}
          placeholder="A short description of the project"
          className="mt-2 block w-full resize-y rounded-[6px] border border-[#cbd8d1] bg-white px-3 py-3 text-sm text-[#1d2925] outline-none transition-colors placeholder:text-[#9ba9a1] focus:border-[#0d6b57] focus:ring-2 focus:ring-[#c8e9db] aria-invalid:border-[#c44d4d]"
        />
        {state.errors.description && (
          <p
            id="description-error"
            className="mt-2 text-sm text-[#a13e3b]"
            role="alert"
          >
            {state.errors.description}
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-end gap-4 pt-6">
        {state.message && <p className="w-full text-sm text-[#a13e3b]" role="alert">{state.message}</p>}
        <Link
          href="/projects"
          className="inline-flex h-10 items-center px-2 text-sm font-medium text-[#5b6c63] hover:text-[#1d2925] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f7663]"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 w-40 items-center justify-center gap-2 rounded-[6px] bg-[#0d6b57] px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#095442] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0d6b57] disabled:cursor-wait disabled:opacity-65"
        >
          {pending ? (
            <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
          ) : (
            <Plus size={16} aria-hidden="true" />
          )}
          {pending ? "Creating..." : "Create project"}
        </button>
      </div>
    </form>
  );
}
