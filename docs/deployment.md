# Deployment

DeployCheck can run on Vercel with a managed PostgreSQL database such as Neon. A public deployment is read-only by default because the MVP has no authentication.

## Before importing the app

1. Create a fresh PostgreSQL database. In Neon, copy both its pooled connection string and its direct connection string. Choose a database region near the Vercel function region. Keep the URLs out of Git and chat logs.
2. Use Node.js 24.x (or a supported 22.x release). Install dependencies with `npm ci` and verify `npm test`, `npm run lint`, and `npm run build`.
3. Apply the checked-in migrations to the fresh database **before** deploying the app. Set `DIRECT_URL` to the direct connection string in a secure terminal or CI environment, then run `npm run db:deploy` and `npm run db:status`. `prisma.config.ts` uses `DIRECT_URL` for CLI commands and falls back to `DATABASE_URL` for local Docker development. Never run `migrate dev` or `db push` against production.
4. Seed once with `npm run db:seed`, setting `DATABASE_URL` to the pooled connection string. The seed inserts fictional projects, releases, and deployment outcomes. It is idempotent and does not overwrite edited rows. Dates are relative to the first seed run; rerunning the seed later does not refresh existing data. For a fresh public demo, create a new database or branch rather than resetting one that contains user changes.

## Vercel setup

1. Import `hannhm1109/DeployCheck` from GitHub as a Next.js project. Use the repository root, the default `npm ci`/install behavior, and `npm run build`. The existing `postinstall` script generates Prisma Client. Enable Vercel system environment variables; the app uses the standard `.next` build directory on Vercel and separate directories for local development and builds.
2. Set `DATABASE_URL` in the Vercel **Production** environment to the pooled PostgreSQL URL. For Preview, use a separate database branch and its own pooled URL. Do not put `DIRECT_URL` in Vercel unless a trusted migration job there actually needs it. Do not prefix database variables with `NEXT_PUBLIC_`.
3. Leave `ALLOW_UNAUTHENTICATED_WRITES` unset. In production, all mutation services reject writes and the UI hides editing controls. This is the safe setting for a public recruiter demo. Only set it to `true` when the deployment is genuinely access-protected; it is not authentication. Vercel's standard protection on Hobby does **not** protect the production domain.
4. Deploy `main`. For future schema changes, apply reviewed, backward-compatible migrations to the target database before deploying code that needs them. Avoid sharing a writable production database with preview deployments.

## Verify the deployment

- The overview loads with seeded projects, an upcoming release, a ready release, and recent deployment outcomes.
- A release detail and the deployment history page load without database errors.
- The header says **Read-only demo**; create/edit and lifecycle controls are absent. Direct visits to `/projects/new` and `/releases/new` explain the read-only state. The server-side guard is covered by `tests/demo-access.test.ts`.
- Vercel function logs show no database connection errors. Check `npm run db:status` against the direct URL if data is missing.

## Environment variables

| Name | Where | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Local and Vercel runtime | PostgreSQL URL; use the pooled URL when hosted. |
| `DIRECT_URL` | Migration terminal or CI only | Direct PostgreSQL URL used by Prisma CLI. Optional for local Docker. |
| `ALLOW_UNAUTHENTICATED_WRITES` | Normally unset | Setting `true` permits writes in production. Do not use on a public demo. |

The deployment is not live until a managed database and Vercel project are connected. See the [Vercel Git deployment guide](https://vercel.com/docs/git), [Vercel environment variable guide](https://vercel.com/docs/environment-variables), [Prisma 7 migration command reference](https://docs.prisma.io/docs/cli/v7/migrate), [Prisma's pooled/direct connection guidance](https://docs.prisma.io/docs/orm/v6/overview/databases/neon), and [Vercel deployment protection limits](https://vercel.com/docs/deployment-protection).
