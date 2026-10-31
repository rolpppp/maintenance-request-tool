# AGENTS.md: instructions for coding agents

You are building **v1 of a maintenance request tool** for a company with about 75 rental units. This is a paid hiring test: a reviewer will read the code and the commit history, and the author must change something live on a 20-minute call. Optimise for **clean, small, obviously correct code** over cleverness or features.

Read before writing any code:
1. `HANDOFF.md`: the full product and design spec (source of truth).
2. `docs/TASKS.md`: the build order. Work through it top to bottom, one task per commit.
3. `supabase/migrations/0001_init.sql`: the schema, security and history rules. Don't weaken it.

## Stack

- **Next.js 16** (App Router, TypeScript, Server Components and Server Actions). Session refresh lives in `proxy.ts` (Next 16 renamed `middleware.ts`).
- **Supabase**: Postgres, Auth (email + password, staff only) and Storage. Use `@supabase/ssr` with the `getAll`/`setAll` cookie adapter and `@supabase/supabase-js` v2.
- **Tailwind CSS v4** with the tokens in `src/styles/tokens.css` (the `@theme` block). Don't invent new colours.
- **zod** for validation, **lucide-react** for icons, **csv-parse** for the importer.
- Hosting: Vercel. Database: Supabase (free tier; free projects pause after a week without activity, so open the project before demos).

Check the installed versions in `package.json` before using an API. If something here conflicts with current official docs, follow the docs and note it in the README.

## Project layout

```
src/
  app/
    page.tsx                    # tenant form (public)
    sent/page.tsx               # confirmation
    actions/submit-request.ts   # server action: validate, insert, upload photos
    staff/
      login/page.tsx
      page.tsx                  # dashboard
      requests/[ref]/page.tsx   # detail
      vendors/page.tsx
      actions.ts                # staff server actions (status, assign, visit, note, vendors)
  components/                   # Tag, StatusPill, CategoryIcon, Toast, Dialog, ...
  config/categories.ts          # follow-up questions, quick checks, emergency answers
  lib/
    supabase/server.ts          # createServerClient (cookies)
    supabase/admin.ts           # service-role client, `import 'server-only'`
    supabase/browser.ts
    auth.ts                     # requireStaff(): getUser() + staff row check, else redirect
    validation.ts               # zod schemas shared by form + action
    format.ts                   # ageWords, humanVisit, time zone helpers
  styles/tokens.css
proxy.ts
supabase/migrations/0001_init.sql
supabase/seed.sql
scripts/import-units.ts
scripts/create-staff.ts
data/sample_units.example.csv
```

## Commands (define these in package.json)

```
npm run dev           # next dev
npm run build         # next build
npm run lint          # eslint
npm run typecheck     # tsc --noEmit
npm run import:units -- data/sample_units.csv
npm run create:staff -- demo@example.com "Maria R." "password"
```

Run `npm run typecheck && npm run lint && npm run build` before every commit.

## Non-negotiable security rules

- **Never** give the `anon` role SELECT on any table or storage object. Tenants can't read anything, ever.
- The **service-role key** is only imported in files that start with `import 'server-only'`. Never prefix it with `NEXT_PUBLIC_`.
- Every staff page and server action calls `requireStaff()` first. On the server, use `supabase.auth.getUser()` (or `getClaims()`), never `getSession()`.
- Staff updates go through the user's own Supabase client (not the admin client), so RLS and the history trigger record the right person.
- Validate every input on the server with zod, even when the client already validated it.
- Photos: check MIME type and size on the server, store at `requests/{uuid}/{uuid}.{ext}`, and serve only through signed URLs (`createSignedUrl`, 300 seconds) after `requireStaff()`.
- Don't add UPDATE/DELETE on `request_events`, don't drop its triggers, and don't let the client choose `actor_id` or `actor_label`.
- The confirmation page must not look up a request by reference number.

## Code style

- TypeScript strict. No `any`. Small files; name things after the domain (`request`, `vendor`, `unit`).
- Server Components by default; add `'use client'` only for interactive parts (form steps, photo picker, toasts, dialogs).
- Copy text comes from `HANDOFF.md` verbatim. Keep follow-up questions and quick checks in `src/config/categories.ts` only, so a question can be changed live with one-line edits.
- Use semantic HTML and the accessibility rules in HANDOFF §7. Add `aria-*` only where HTML can't express it.
- Motion: only what HANDOFF §6 lists, and always with a reduced-motion version.
- Comments explain *why*, not *what*.

## Commits

- One task from `docs/TASKS.md` per commit, in the imperative ("Add tenant form step 3: category and follow-ups").
- Never commit secrets, `.env*` (except `.env.example`), or any real customer data. Don't commit `Recurring_Payments.xlsx` or any file other than the provided sample data.
- Keep a running log of AI involvement in `docs/AI_LOG.md` (what was generated, what was changed by hand). The README's "Which parts AI wrote" section is built from it.

## Definition of done (per task)

- Typecheck, lint and build pass.
- The screen matches HANDOFF (copy, states, tokens), works at 375px and 1440px, and works by keyboard.
- Security rules above still hold. For anything touching data, try it as an anonymous user in the browser console with the anon key and confirm it's denied.

## Don't build

Tenant accounts or request lookup, email/SMS, calendars, vendor logins, analytics or charts, multi-language, editing or deleting requests, roles, dark mode, quick-assign on the dashboard. If a task seems to need one of these, stop and write the question in `docs/QUESTIONS.md` instead.
