# AI involvement log

Keep this honest and short. The README's "Which parts AI wrote" section is built from it.

| Date | Part | What AI produced | What I reviewed or changed by hand | How I verified it |
|---|---|---|---|---|
| 2026-10-31 | Planning + design | Build plan, wireframes (Claude canvas), HANDOFF.md, design tokens | Chose the scope; picked the white palette; reviewed all copy | Walked every screen in Play mode |
| 2026-10-31 | Database | `0001_init.sql` (schema, RLS, column grants, append-only history triggers) | | Ran on Postgres 16 with stub `auth`/`storage` schemas; tested anon, non-staff and staff access, forged-actor notes, update/delete/truncate on history |
| 2026-10-31 | Config + scripts | `categories.ts`, `status.ts`, `import-units.ts`, `create-staff.ts` | | Typecheck |
| | | | | |
| 2026-10-31 | 0.1 Scaffold | `create-next-app` output (Next 16.4.3, Tailwind v4), root layout with Inter, placeholder home page, npm scripts, `.gitignore`; removed boilerplate and set `cacheComponents` off | | `npm run typecheck`, `lint`, `build` pass; dev server renders `/` with Inter |
| 2026-10-31 | 1.1 Importer | Rewrote `import-units.ts` for the real CSV headers: vacant units, case-insensitive property match, duplicate rows, length checks, warnings for bad emails/phones, batched upserts, moved-out tenants, `--dry-run` | | `--dry-run` on `data/sample_units.csv`; typecheck, lint, build |
| 2026-10-31 | 1.2 Staff script | Reviewed `create-staff.ts`; added zod argument validation (email, name 1-80, password min 8) | | typecheck, lint, build |
| 2026-10-31 | 0.3 Supabase clients + auth | `lib/supabase/{server,browser,admin}.ts`, `lib/env.ts`, `lib/auth.ts` (`requireStaff`), `src/proxy.ts`, placeholder `/staff` and `/staff/login` | | `typecheck`, `lint`, `build` pass with no `.env.local`; dev server with dummy env: `/staff` returns 307 to `/staff/login` |
