# DeployCheck

DeployCheck is a release-readiness and deployment tracking app for small software teams. It keeps projects, releases, included tickets, deployment checks, rollback plans, and deployment outcomes in one place. Unlike a general issue tracker, it focuses on the decision to ship a specific release and on recording what happened afterward.

## What you can do

- Create projects and versioned releases with target deployment dates.
- Add release tickets and track their readiness.
- Complete five deployment checks and document a rollback plan.
- See a deterministic readiness result with actionable blockers.
- Move a release through controlled review, deployment, failure, and rollback states.
- Review recent activity and filter deployment history.
- Sign in with email and password, create a team workspace, and invite teammates with a one-use link.
- Share projects and releases with members of the same workspace while keeping other workspaces isolated.
- Use the interface in English or French. English URLs are unprefixed; French URLs start with `/fr` (for example, `/fr/releases`). The language switch keeps you on the corresponding page.

The app does not deploy software for you or replace an issue tracker. Issue-tracker integrations, notifications, and automated deployments are outside the current scope.

## How it works

```text
Next.js UI -> authenticated Server Actions -> services and domain rules -> Prisma -> PostgreSQL
```

Better Auth handles password hashing and database-backed sessions. The session identifies the user; a membership grants access to a workspace. An HTTP-only cookie selects the active workspace, but every request verifies that selection against current membership. Projects, releases, overview metrics, and deployment history are scoped to that workspace. Projects and releases are never stored in the session or browser storage.

Forms use Server Actions with Zod validation. Services enforce edit permissions and lifecycle transitions before writing through Prisma. Readiness is calculated from current tickets, checklist rows, and rollback notes rather than stored as a flag or inferred by AI. Status changes are checked again on the server, and deployment outcomes are written in the same transaction as their status change.

`User` joins a `Workspace` through `Membership` (`OWNER` or `MEMBER`). A workspace owns `Project` records; a project owns `Release` records. A release owns its `ReleaseItem` tickets, `ReleaseChecklistItem` checks, and `Deployment` outcomes. Project slugs are unique within a workspace, release versions within a project, and ticket references within a release. Both roles can edit release data; owners can also create one-use, seven-day invitation links. There is no email invitation service.

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
src/server/access.ts       Authenticated workspace selection and membership checks
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
# Replace BETTER_AUTH_SECRET in .env with a unique random secret; keep it out of Git.
npm install
npm run db:deploy
npm run db:seed
npm run db:status
npm test
npm run dev
```

Open <http://localhost:3000> or <http://localhost:3000/fr>, create an account, then create a workspace. The seed is repeatable and leaves existing records unchanged. Existing projects and the seeded examples belong to the preserved `legacy-demo` workspace. To see those records, register your account first, then run `npm run workspace:claim -- you@example.com` in a trusted terminal. This assigns the first owner of that workspace; afterward, invite teammates from **Team**. Do not use the claim command to add ordinary members.

For database-backed smoke checks, run `npm run test:projects`, `test:releases`, `test:release-items`, `test:checklist`, `test:lifecycle`, and `test:overview` (each as a separate `npm run` command). With the dev server running, `npm run test:collaboration` also checks three temporary accounts, shared workspace access, cross-workspace isolation, and anonymous access. The checks clean up their temporary records.

If Prisma reports `ECONNREFUSED`, start Docker Desktop and your database container, then check `docker exec deploycheck-postgres pg_isready -U postgres -d deploycheck` (substitute your existing container name if different) and `npm run db:status`. After a reboot, Docker Desktop must be running before the app can reach PostgreSQL.

To use the dev server from another device on your LAN, set `DEV_ALLOWED_ORIGIN` to your current LAN hostname or IP in ignored `.env.local`, then restart `npm run dev`. Do not include a scheme or port. This origin is also trusted for local authentication. If a hydration warning mentions `data-extension-*` attributes on `<html>`, try a clean browser profile; those attributes are added by a browser extension.

Development and local production builds use separate ignored output directories (`.next-dev-local` and `.next-build`). On Windows when the repository is under OneDrive, `npm run dev` creates a junction from `.next-dev-local` to an unsynced cache under `%LOCALAPPDATA%\DeployCheck\next-dev`; this avoids OneDrive locking Next's generated files. The old `.next-dev` directory is no longer used and can be removed after OneDrive releases it. The dev command uses Webpack because the current Turbopack version can panic during hot reload; production builds still use the default bundler. Hosted runtime queries use `DATABASE_URL`; Prisma CLI commands use `DIRECT_URL` when provided. Set `BETTER_AUTH_URL` to the exact app origin and use a unique `BETTER_AUTH_SECRET` in each environment. Apply committed migrations with `npm run db:deploy` in deployment environments. See the [deployment guide](docs/deployment.md) for hosting and optional read-only demo configuration.

## Stack

Next.js App Router, React, TypeScript, Tailwind CSS, next-intl, Better Auth, PostgreSQL, Prisma, Zod, Lucide icons, ESLint, and Vitest.
