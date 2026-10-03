# Deployment

DeployCheck runs on Vercel with Supabase PostgreSQL. Application data is private to authenticated workspace members; the public production deployment is writable by signed-in users. Production and Preview must not share a database.

## Before deploying

1. Create a dedicated Supabase project. Use its transaction pooler URL (port 6543) for the Vercel runtime. Use its direct URL for migrations, or its session pooler URL (port 5432) where direct IPv6 access is unavailable. Keep URLs and passwords out of Git and chat logs. Require TLS in both URLs.
2. Use Node.js 24.x (or a supported 22.x release). Run `npm ci`, `npm test`, `npm run lint`, and `npm run build`.
3. Set `DIRECT_URL` to the migration connection string in a trusted terminal or CI job. Apply the checked-in migrations with `npm run db:deploy`, then check `npm run db:status`. Do not use `migrate dev` or `db push` against production. For an existing DeployCheck database, the collaboration migration preserves projects and releases under the `legacy-demo` workspace.
4. Disable Supabase's Data API for this Prisma-only database, and revoke `anon` and `authenticated` table grants and default table grants in `public`. The app uses direct PostgreSQL connections, not Supabase Auth or REST. Optionally run `npm run db:seed` once with `DATABASE_URL` set. The seed creates fictional records in `legacy-demo`; it does not overwrite edited rows. Avoid seeding a workspace intended only for real data.

## Vercel setup

1. Connect `hannhm1109/DeployCheck` as a Next.js project and deploy the repository root. The `postinstall` script generates Prisma Client. `vercel.json` places functions in Dublin near the Supabase Ireland database.
2. Set `DATABASE_URL` to the Supabase transaction pooler URL. Set `BETTER_AUTH_URL` to the exact public origin (currently `https://deploycheck-ten.vercel.app`) and `BETTER_AUTH_SECRET` to a unique random secret of at least 32 characters. Keep these server-only. Assign them to Production only. Preview has no database credentials, so it cannot access or migrate production data; configure a separate Preview database before expecting functional Preview deployments. Do not set `DIRECT_URL` in Vercel unless a trusted migration job there needs it.
3. Apply migrations to each environment's database before deploying code that depends on them. Deploy `main`, then register the first account and create a workspace. If upgrading an existing database or using seeded examples, run `npm run workspace:claim -- owner@example.com` from a trusted terminal after that account registers. This gives the first owner access to `legacy-demo` without moving or deleting its records. Invite other users from the Team page.
4. Keep `READ_ONLY_DEMO` unset for normal collaboration. Setting it to `true` disables release/project edits globally as a demo safeguard, but it is not an authentication mechanism.

## Verify

- A visitor is sent to sign-in before seeing project, release, overview, team, or history data.
- A new user can create a workspace, then create a project and release. A one-use Team invitation lets another account join that workspace.
- A user in a different workspace cannot see or mutate those records, even by using a direct URL or changing the workspace cookie.
- `npm run db:status` reports no pending migrations; runtime logs show no database or auth configuration errors.

With a local dev server and a disposable database, `npm run test:collaboration` exercises the invitation and isolation flows using temporary accounts. Do not run it against a production database.

## Environment variables

| Name | Where | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Production runtime and seed | Supabase transaction pooler URL with TLS. |
| `DIRECT_URL` | Trusted migration terminal only | Direct PostgreSQL URL, or session pooler URL when IPv6 is unavailable. Optional for local Docker. |
| `BETTER_AUTH_URL` | Runtime | Exact public application origin, without a trailing path. |
| `BETTER_AUTH_SECRET` | Runtime | Unique secret of at least 32 characters; never commit it. |
| `READ_ONLY_DEMO` | Optional runtime | Set to `true` only for an intentionally non-editable demo. |
| `DEV_ALLOWED_ORIGIN` | Local development only | LAN hostname or IP for Next.js development access. |

See the [Vercel Git deployment guide](https://vercel.com/docs/git), [Supabase connection guide](https://supabase.com/docs/guides/database/connecting-to-postgres), [Supabase Data API security guide](https://supabase.com/docs/guides/api/securing-your-api), and [Prisma migration command reference](https://www.prisma.io/docs/cli/v7/migrate/deploy).
