# DeployCheck

DeployCheck is a release-readiness and deployment tracking app for small software teams. It keeps projects, releases, included tickets, deployment checks, rollback plans, and deployment outcomes in one place. Unlike a general issue tracker, it focuses on the decision to ship a specific release and on recording what happened afterward.

## What you can do

- Create projects and versioned releases with target deployment dates.
- Add release tickets and track their readiness.
- Complete five deployment checks and document a rollback plan.
- See a deterministic readiness result with actionable blockers.
- Move a release through controlled review, deployment, failure, and rollback states.
- Review recent activity and filter deployment history.
- Use the interface in English or French. English URLs are unprefixed; French URLs start with `/fr` (for example, `/fr/releases`). The language switch keeps you on the corresponding page.

The app does not deploy software for you or replace an issue tracker. Authentication, issue-tracker integrations, notifications, and automated deployments are outside the current scope. Public production builds are read-only by default until authentication is added; local development remains writable.

## How it works

```text
Next.js UI -> Server Actions -> services and domain rules -> Prisma -> PostgreSQL
```

Forms use Server Actions with Zod validation. Services enforce edit permissions and lifecycle transitions before writing through Prisma. Readiness is calculated from current tickets, checklist rows, and rollback notes rather than stored as a flag or inferred by AI. Status changes are checked again on the server, and deployment outcomes are written in the same transaction as their status change.

`Project` owns `Release` records. A release owns its `ReleaseItem` tickets, `ReleaseChecklistItem` checks, and `Deployment` outcomes. Project slugs are unique, and release versions are unique within a project. Ticket references are unique within a release.

A release is ready when all five required checks are complete, migration/environment/background-job decisions are recorded, all included tickets are ready, and rollback notes exist. A release with no tickets can still be ready. The usual lifecycle is `DRAFT -> IN_REVIEW -> READY -> DEPLOYING -> DEPLOYED`; review can return to draft, ready can return to review, deploying can fail, and failed or deployed releases can be rolled back.

Key directories:

```text
messages/                  English and French UI text
src/app/[locale]/          Localized pages and layouts
src/components/           Shared UI
src/features/             Project, release, and deployment UI
src/i18n/                 Locale routing and navigation
src/lib/domain/releases/  Pure readiness and transition rules
src/lib/validation/       Input schemas
src/server/actions/       Server Action entry points
src/server/services/      Application workflows
src/server/data/          Prisma queries
prisma/                   Schema, migrations, and seed data
tests/                    Domain and database smoke tests
```

## Run locally

You need Node.js and Docker Desktop. The included commands use a local PostgreSQL container. Start Docker Desktop, then create it once:

```powershell
docker run -d --name deploycheck-postgres --restart unless-stopped -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=deploycheck -p 127.0.0.1:55432:5432 postgres:17-alpine
```

If you already have a container for DeployCheck, start that one instead of creating another (`docker ps -a` shows its name). For the command above, use `docker start deploycheck-postgres` on later runs.

```powershell
Copy-Item .env.example .env
npm install
npm run db:deploy
npm run db:seed
npm run db:status
npm test
npm run dev
```

Open <http://localhost:3000> or <http://localhost:3000/fr>. The seed is repeatable and leaves existing records unchanged. For database-backed smoke checks, run `npm run test:projects`, `test:releases`, `test:release-items`, `test:checklist`, `test:lifecycle`, and `test:overview` (each as a separate `npm run` command). They create and remove temporary records.

If Prisma reports `ECONNREFUSED`, start Docker Desktop and your database container, then check `docker exec deploycheck-postgres pg_isready -U postgres -d deploycheck` (substitute your existing container name if different) and `npm run db:status`. After a reboot, Docker Desktop must be running before the app can reach PostgreSQL.

To use the dev server from another device on your LAN, set `DEV_ALLOWED_ORIGIN` to your current LAN hostname or IP in ignored `.env.local`, then restart `npm run dev`. Do not include a scheme or port. If a hydration warning mentions `data-extension-*` attributes on `<html>`, try a clean browser profile; those attributes are added by a browser extension.

Development and local production builds use separate ignored output directories (`.next-dev` and `.next-build`) to avoid generated-file conflicts on synced Windows workspaces. The dev command uses Webpack because the current Turbopack version can panic during hot reload; production builds still use the default bundler. Hosted runtime queries use `DATABASE_URL`; Prisma CLI commands use `DIRECT_URL` when provided. Apply committed migrations with `npm run db:deploy` in deployment environments. See the [deployment guide](docs/deployment.md) for hosting and read-only demo configuration.

## Stack

Next.js App Router, React, TypeScript, Tailwind CSS, next-intl, PostgreSQL, Prisma, Zod, Lucide icons, ESLint, and Vitest.
