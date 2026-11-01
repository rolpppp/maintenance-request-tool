# Build tasks, in order

Each task is one commit. Tick it off when its checks pass. Time estimates add up to about 5 hours.

## Phase 0: Setup (30 min)

- [x] **0.1 Scaffold.** `create-next-app` (TypeScript, App Router, Tailwind, ESLint, `src/`). Add `@supabase/ssr`, `@supabase/supabase-js`, `zod`, `lucide-react`, `server-only`, `csv-parse`, `tsx` (dev). Add the npm scripts from AGENTS.md. Copy `src/styles/tokens.css` and import it in the root layout. Load Inter from `next/font/google`.
  *Check:* `npm run build` passes; the page uses Inter and a white background.
- [x] **0.2 Database.** Create the Supabase project, run `supabase/migrations/0001_init.sql`, then `supabase/seed.sql`.
  *Check:* with the anon key, `select * from requests` returns no rows or a permission error; inserting into `request_events` with the anon key fails.
- [x] **0.3 Supabase clients + auth helper.** `lib/supabase/server.ts`, `browser.ts`, `admin.ts` (`import 'server-only'`), `proxy.ts` session refresh (matcher excludes static assets), `lib/auth.ts` `requireStaff()`.
  *Check:* `/staff` redirects to `/staff/login` when signed out.

## Phase 1: Data (25 min)

- [x] **1.1 Importer.** `scripts/import-units.ts`: reads a CSV, maps columns via the `COLUMN_MAP` constant, and upserts properties → units → tenants. Re-running it creates no duplicates. Prints a summary.
  *Check:* run it twice on `data/sample_units.example.csv`; the counts don't change on the second run.
- [x] **1.2 Staff account script.** `scripts/create-staff.ts`: creates an Auth user (email confirmed) plus a `staff` row.
  *Check:* you can sign in with the created user once 3.1 is done.

## Phase 2: Tenant side (1 h 30 min)

- [x] **2.1 Form shell + steps 1–2** (HANDOFF §5.1): header, emergency banner, property → unit (unit numbers only), contact. Load properties and units in a Server Component with the admin client, passing only `{id, name}` and `{id, unit_number}`.
- [x] **2.2 Step 3:** category tiles, quick check flow, follow-up chips, inline emergency prompt, all driven by `src/config/categories.ts`. Clear answers when the category changes.
- [x] **2.3 Step 4 + client validation:** description, photo picker with previews/remove/errors, entry permission, error summary, sending state, honeypot.
- [x] **2.4 Submit server action** (`actions/submit-request.ts`):
  1. zod-validate (reuse `lib/validation.ts`).
  2. Check the honeypot.
  3. Check that the unit exists.
  4. Compute `contact_matches_tenant`: a normalised phone or email (case-insensitive) equals the current tenant's.
  5. Set `emergency_flag` if any chosen answer is an emergency.
  6. Insert with the admin client (retry up to 3 times on a `ref` unique violation).
  7. Upload photos to `request-photos` and insert `request_photos` rows.
  8. Return `{ ref, summary }`.

  *Check:* submitting with the anon key straight to the REST API is impossible (RLS); a wrong MIME type or an 11 MB file is rejected on the server.
- [x] **2.5 Confirmation page** (§5.2): large tag, Copy, timeline. Pass the data via a short-lived signed, httpOnly cookie or the action's return value. No lookup by reference.

## Phase 3: Staff side (1 h 30 min)

- [x] **3.1 Sign in** (§5.3) with inline errors and loading. Sign out.
- [x] **3.2 Dashboard** (§5.4): counters, filters (URL search params, so they survive a refresh), grouped table, whole-row links, loading/empty/no-match/error states.
- [x] **3.3 Request detail, read view** (§5.5): left column, signed photo URLs (300 s), activity timeline from `request_events`.
- [x] **3.4 Request detail, actions:** status, assignment, visit and note as server actions using the **user's** client; toasts; revalidate the page.
  *Check:* each change adds exactly one Activity entry with the right name and time; trying to update `description` through the API as staff fails (column grants).
- [x] **3.5 Vendors page** (§5.6) + remove-vendor dialog with Undo (soft delete via `is_active`).
- [x] **3.6 Photo viewer dialog** (§5.7.1) with keyboard support.
- [x] **3.7 Log a phone request:** reuse the form in staff mode (`source = 'staff_phone'`, inserted with the user's client so the creator is recorded).

## Phase 4: Finish (45 min)

- [x] **4.1 Security pass.** Re-run every *Check* above. With the anon key: no reads on any table, no storage downloads, no event inserts. As staff: no event update/delete. Confirm the service-role key isn't in the client bundle (`grep` the `.next/static` folder for its first 10 characters).
- [x] **4.2 Polish pass.** 375px and 1440px, keyboard-only run-through, reduced motion, contrast spot-check.
- [ ] **4.3 Deploy** to Vercel; set env vars; create the demo staff user; import the sample data; submit 6–8 realistic requests so the dashboard shows every group.
- [x] **4.4 README** from `README.template.md` + `docs/AI_LOG.md`.
- [ ] **4.5 (Optional) Mark as Done dialog** (§5.7.3), only if time remains.

## Live-change rehearsal (for the 20-minute call)

Likely asks, and where the change lives:
- Add or change a follow-up question or quick-check step → `src/config/categories.ts`
- Add a status → `request_status` enum migration + `STATUS_META` in `src/config/status.ts` + the dashboard group rule
- Change the aging threshold → `AGING_DAYS` env var / `lib/format.ts`
- Add a field to the form → zod schema + migration + one form section + detail view
