# DeployCheck

DeployCheck is a lightweight release-readiness and deployment tracking tool for small software teams. It brings release tickets, deployment checks, rollback plans, and deployment history into one workflow.

## Current status

Phase 3 is complete: releases can be listed, created for a project, and opened in a read-only detail view. New releases start in `DRAFT` and receive the five required checklist rows. Release-item editing, checklist interaction, and status transitions belong to later phases.

## MVP workflow

1. Create a project and a versioned release.
2. Add the tickets included in that release and track their readiness.
3. Complete required deployment checks and document a rollback plan.
4. Review a deterministic readiness result with specific blockers.
5. Move the release through intentional status transitions and record deployment outcomes.
6. Browse recent releases and deployment history.

The MVP excludes authentication, external issue tracker integrations, automated deployments, notifications, and analytics.

## Architecture

The planned request path is:

```text
Next.js UI -> Server Actions -> services and domain rules -> data access -> Prisma -> PostgreSQL
```

Project and release forms call Server Actions that validate input with Zod, pass it through a service, and then use Prisma data access. Duplicate project slugs and release versions are reported on their forms. Release creation initializes required checks in the same database write. Route Handlers will be added only when an external caller or webhook needs an HTTP endpoint. Readiness and transition rules are pure functions outside React components; later server services will call them before saving a status change.

Planned structure as features are implemented:

```text
src/app/                  Pages and layouts
src/components/           Shared UI
src/features/             Project, release, item, and deployment UI
src/lib/domain/releases/  Pure readiness and transition rules
src/lib/validation/       Input schemas
src/server/actions/       Server Action entry points
src/server/services/      Application workflows
src/server/data/          Prisma queries
prisma/                   Schema, migrations, and seed data
tests/domain/             Business-rule tests
```

## Data model

- `Project` has many `Release` records; its slug is unique.
- `Release` belongs to a project and has many `ReleaseItem`, `ReleaseChecklistItem`, and `Deployment` records. Version is unique within a project.
- `ReleaseItem` tracks an external reference, type, readiness status, and notes.
- `ReleaseChecklistItem` tracks a required check, completion state, optional notes, and a yes/no `changeRequired` decision for migrations, environment variables, and background jobs.
- `Deployment` records the time, outcome, and optional notes for a deployment attempt.

## Core rules

- A release is ready only when all five checks exist and are complete, migration/environment/job decisions are recorded, all included items are ready, and rollback notes are present. A release with no tickets can still be ready.
- The readiness result includes completion counts and specific blockers.
- The intended path is `DRAFT -> IN_REVIEW -> READY -> DEPLOYING -> DEPLOYED`. Review can return to draft, ready can return to review, deploying can fail, and failed or deployed releases can be rolled back.
- Entering `READY` or `DEPLOYING` requires current readiness. Entering `DEPLOYED` requires a deployment timestamp.
- Deployment attempts are separate history records; the seed includes a success and a failure followed by rollback.

The pure functions and their tests are in `src/lib/domain/releases/` and `tests/domain/`. Server-side mutation enforcement is scheduled for Phase 6.

## Stack and local setup

The project uses Next.js App Router, TypeScript, Tailwind CSS, PostgreSQL, Prisma 7, Zod, Lucide icons, ESLint, and Vitest. Forms use React's `useActionState` for validation feedback without a separate form library.

Start PostgreSQL locally with Docker Desktop:

```powershell
docker run -d --name deploycheck-phase1-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=deploycheck -p 127.0.0.1:55432:5432 postgres:17-alpine
```

If that container already exists, use `docker start deploycheck-phase1-postgres`. Then configure and initialize the app:

```bash
cp .env.example .env
npm install
npm run db:migrate -- --name init
npm run db:seed
npm test
npm run test:projects
npm run test:releases
npm run dev
```

On PowerShell, use `Copy-Item .env.example .env` instead of `cp` if preferred. Open <http://localhost:3000> to browse projects and releases. The seed is repeatable and leaves existing records unchanged. The `test:projects` and `test:releases` smoke scripts need the local database; each creates and removes temporary records.

To check Phase 3 manually, open **Releases**, create a release, and confirm its title, version, target date, rollback plan, and `Draft` status on the detail page. Return to the list and open the project to confirm the release appears in both places. Creating the same version twice within one project should show a form error; the same version in another project is allowed.

## Why this shape

Next.js provides the UI and server entry points in one application. PostgreSQL fits the related projects, releases, tickets, checks, and deployment history. Prisma will make those relationships and migrations explicit. A small service/domain layer keeps readiness and status rules consistent across screens and future integrations without introducing a full enterprise architecture.

## Next phase

Phase 4 will add release-item creation and editing. Each phase stops for review before the next begins.
