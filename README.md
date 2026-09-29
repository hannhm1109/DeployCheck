# DeployCheck

DeployCheck is a lightweight release-readiness and deployment tracking tool for small software teams. It brings release tickets, deployment checks, rollback plans, and deployment history into one workflow.

## Current status

Phase 6 is complete: release status changes follow an intentional server-enforced path. Marking a deployment succeeded, failed, or rolled back records a timestamped outcome with optional notes. The dashboard and full deployment-history views belong to Phase 7.

## MVP workflow

1. Create a project and a versioned release.
2. Add the tickets included in that release and track their readiness.
3. Complete required deployment checks and document a rollback plan.
4. Review a deterministic readiness result with specific blockers.
5. Move the release through intentional status transitions and record deployment outcomes.
6. Browse recent releases and deployment history.

The MVP excludes authentication, external issue tracker integrations, automated deployments, notifications, and analytics.

## Architecture

The request path is:

```text
Next.js UI -> Server Actions -> services and domain rules -> data access -> Prisma -> PostgreSQL
```

Project and release forms call Server Actions that validate input with Zod, pass it through a service, and then use Prisma data access. Duplicate project slugs and release versions are reported on their forms. Release creation initializes required checks in the same database write. Route Handlers will be added only when an external caller or webhook needs an HTTP endpoint. Readiness and transition rules are pure functions outside React components and are enforced again on every status change.

Release-item actions follow the same path. They normalize external references, enforce uniqueness within a release, scope edits and removals to that release, and permit changes only while the release is `DRAFT` or `IN_REVIEW`. Readiness is recalculated from current database rows rather than stored as a potentially stale flag.

Checklist and rollback-plan actions use the same edit guard. The five checklist kinds are stored as separate rows, with a yes/no/undecided change decision for migration, environment, and background-job checks. The readiness view reads persisted checks and tickets, applies the pure domain calculation, and links each blocker to the section that can resolve it.

Lifecycle changes run in a serializable database transaction. The service rechecks current readiness and status, updates the release, and records any deployment outcome atomically. Concurrent-write conflicts are retried. Ticket and checklist writes also lock the parent release in a transaction, so an edit cannot slip across the point where a release becomes ready.

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
- Tickets can be changed only while their release is in draft or review. Their references are unique within a release, not across projects or releases.
- A completed migration, environment, or background-job check still blocks readiness until its change decision is recorded. Rollback notes and the rollback-plan check are separate requirements.
- The readiness result includes completion counts and specific blockers.
- The intended path is `DRAFT -> IN_REVIEW -> READY -> DEPLOYING -> DEPLOYED`. Review can return to draft, ready can return to review, deploying can fail, and failed or deployed releases can be rolled back.
- Entering `READY` or `DEPLOYING` requires current readiness. Entering `DEPLOYED` requires a deployment timestamp.
- Successful deployment, failed deployment, and rollback each create a separate outcome record. `deployedAt` is set together with a successful outcome; the seed includes a success and a failure followed by rollback.

The pure functions and their tests are in `src/lib/domain/releases/` and `tests/domain/`. Lifecycle services enforce them before any status write.

## Stack and local setup

The project uses Next.js App Router, TypeScript, Tailwind CSS, PostgreSQL, Prisma 7, Zod, Lucide icons, ESLint, and Vitest. Forms use React's `useActionState` for validation feedback without a separate form library.

Development and production builds use separate ignored output directories (`.next-dev` and `.next-build`) so they do not contend for generated files on synced Windows workspaces.

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
npm run test:release-items
npm run test:checklist
npm run test:lifecycle
npm run dev
```

On PowerShell, use `Copy-Item .env.example .env` instead of `cp` if preferred. Open <http://localhost:3000> to browse projects and releases. The seed is repeatable and leaves existing records unchanged. The five `test:*` smoke scripts need the local database; each creates and removes temporary records.

To check Phase 6 manually, create a temporary release, start review, and confirm that **Mark ready** stays disabled until the blockers are resolved. Complete checks and the rollback plan, then move through Ready, Deploying, and Deployed with an outcome note. Confirm the status, deployed timestamp, and latest outcome. Record a rollback and confirm its latest outcome. A separate temporary release can exercise the Failed path. Direct jumps such as Draft to Deployed must be rejected by the server.

## Why this shape

Next.js provides the UI and server entry points in one application. PostgreSQL fits the related projects, releases, tickets, checks, and deployment history. Prisma will make those relationships and migrations explicit. A small service/domain layer keeps readiness and status rules consistent across screens and future integrations without introducing a full enterprise architecture.

## Next phase

Phase 7 will add the dashboard overview, recent releases, and full deployment history. Each phase stops for review before the next begins.
