# Deployment

DeployCheck runs on Vercel with PostgreSQL. Application data is private to authenticated workspace members; a public deployment is writable by signed-in users. Use a separate database for each environment.

## Before deploying

1. Create a PostgreSQL database. For a managed provider such as Neon, keep both its pooled runtime URL and direct migration URL out of Git and chat logs.
2. Use Node.js 24.x (or a supported 22.x release). Run `npm ci`, `npm test`, `npm run lint`, and `npm run build`.
3. Set `DIRECT_URL` to the direct connection string in a trusted terminal or CI job. Apply the checked-in migrations with `npm run db:deploy`, then check `npm run db:status`. Do not use `migrate dev` or `db push` against production. For an existing DeployCheck database, the collaboration migration preserves projects and releases under the `legacy-demo` workspace.
4. Optionally run `npm run db:seed` once with `DATABASE_URL` set. The seed creates fictional records in `legacy-demo`; it does not overwrite edited rows. Avoid seeding a workspace intended only for real data.

## Vercel setup

1. Import `hannhm1109/DeployCheck` as a Next.js project and deploy the repository root. The `postinstall` script generates Prisma Client.
2. Set `DATABASE_URL` to the pooled PostgreSQL URL. Set `BETTER_AUTH_URL` to the exact public origin (for example, `https://your-domain.example`) and `BETTER_AUTH_SECRET` to a unique random secret of at least 32 characters. Keep these server-only. Use separate values and a separate database for Preview. Do not set `DIRECT_URL` in Vercel unless a trusted migration job there needs it.
3. Apply migrations to each environment's database before deploying code that depends on them. Deploy `main`, then register the first account and create a workspace. If upgrading an existing database or using seeded examples, run `npm run workspace:claim -- owner@example.com` from a trusted terminal after that account registers. This gives the first owner access to `legacy-demo` without moving or deleting its records. Invite other users from the Team page.
4. Keep `READ_ONLY_DEMO` unset for normal collaboration. Setting it to `true` disables release/project edits as a demo safeguard, but it is not an authentication mechanism.

## Verify

- A visitor is sent to sign-in before seeing project, release, overview, team, or history data.
- A new user can create a workspace, then create a project and release. A one-use Team invitation lets another account join that workspace.
- A user in a different workspace cannot see or mutate those records, even by using a direct URL or changing the workspace cookie.
- `npm run db:status` reports no pending migrations; runtime logs show no database or auth configuration errors.

With a local dev server and a disposable database, `npm run test:collaboration` exercises the invitation and isolation flows using temporary accounts. Do not run it against a production database.

## Environment variables

| Name | Where | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Runtime and seed | PostgreSQL URL; use a pooled URL when hosted. |
| `DIRECT_URL` | Migration terminal or CI | Direct PostgreSQL URL for Prisma CLI. Optional for local Docker. |
| `BETTER_AUTH_URL` | Runtime | Exact public application origin, without a trailing path. |
| `BETTER_AUTH_SECRET` | Runtime | Unique secret of at least 32 characters; never commit it. |
| `READ_ONLY_DEMO` | Optional runtime | Set to `true` only for an intentionally non-editable demo. |
| `DEV_ALLOWED_ORIGIN` | Local development only | LAN hostname or IP for Next.js development access. |

The deployment is not live until a managed database and Vercel project are connected. See the [Vercel Git deployment guide](https://vercel.com/docs/git), [Vercel environment variable guide](https://vercel.com/docs/environment-variables), and [Prisma migration command reference](https://docs.prisma.io/docs/cli/v7/migrate).
