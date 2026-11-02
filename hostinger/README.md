# Hostinger deployment

Package source with `python hostinger/package.py`. Upload the resulting root ZIP to three Node.js Web Apps, using Node 22 and the Other framework preset.

- Root directory: `./`
- Build command: `pnpm run build:hostinger`
- Package manager: pnpm
- Output directory: `./`
- Entry file: `hostinger/start.cjs`

Set `APP_TARGET` to `api`, `web`, or `admin` before building each app.

The API requires `DATABASE_URL`, a random `JWT_SECRET` of at least 32 characters, `CORS_ORIGINS`, and `ADMIN_ORIGINS`. Use `127.0.0.1:3306` for a database on the same Hostinger account. Percent-encode database credentials in `DATABASE_URL`. Keep credentials in Hostinger environment variables, outside the source ZIP.

For the storefront, set `API_INTERNAL_URL` to the deployed API URL followed by `/api/v1` and `API_ORIGIN` to its origin before building. For the admin panel, set `API_ORIGIN` to the API origin before building.

Import `database/jhatpat.sql` into a new, empty database. The Windows dump uses lowercase table names; on a case-sensitive MySQL server, rename its application tables to the Prisma model names in `apps/api/prisma/schema.prisma`. Do not rerun development migrations against an imported production database.

The API serves files from `apps/api/uploads`. Preserve uploaded files when deploying later versions. The source ZIP includes existing product images.

Local production builds verified with the Hostinger build script for all three targets. It uses Webpack for the Next.js apps.
