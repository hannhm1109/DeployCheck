# DeployCheck

DeployCheck is a lightweight release-readiness and deployment tracking tool for small software teams. It brings release tickets, deployment checks, rollback plans, and deployment history into one workflow.

## Current status

Phase 0 is complete: architecture and a minimal Next.js project skeleton. Product workflows, database models, and seed data are planned for later phases. The current page is only a placeholder.

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

Server Actions will handle app-owned forms and mutations. Route Handlers will be added only when an external caller or webhook needs an HTTP endpoint. Zod will validate input at server boundaries. Readiness and lifecycle rules will live outside React components so they can be tested without rendering the UI.

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
- `ReleaseChecklistItem` tracks a required check, completion state, and optional notes.
- `Deployment` records the time, outcome, and optional notes for a deployment attempt.

## Core rules

- A release is ready only when all required checks are complete and all included items are ready. The readiness result must list every blocker.
- A release cannot enter `READY` while blockers remain.
- The intended path is `DRAFT -> IN_REVIEW -> READY -> DEPLOYING -> DEPLOYED`, with failure and rollback paths handled explicitly.
- A deployed release requires a deployment timestamp. Deployment attempts belong in history instead of being overwritten.
- The server enforces transitions; the UI only presents allowed actions.

These rules and the exact schema will be implemented and tested in Phase 1 and later workflow phases.

## Stack and local setup

The scaffold uses Next.js App Router, TypeScript, Tailwind CSS, and ESLint. PostgreSQL, Prisma, Zod, and focused domain tests will be added when their corresponding features are built. UI primitives from shadcn/ui will be added only where useful.

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. No database is required for the Phase 0 placeholder.

## Why this shape

Next.js provides the UI and server entry points in one application. PostgreSQL fits the related projects, releases, tickets, checks, and deployment history. Prisma will make those relationships and migrations explicit. A small service/domain layer keeps readiness and status rules consistent across screens and future integrations without introducing a full enterprise architecture.

## Next phase

Phase 1 will add the Prisma schema, migration, realistic fictional seed data, pure readiness functions, and tests. Each phase stops for review before the next begins.
