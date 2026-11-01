# Maintenance Request Tool

A simple tool for a ~75-unit rental company: tenants report problems through one phone-friendly form, and staff track, assign and close them on one dashboard.

- **Live app:** [URL]
- **Staff demo login:** `[email]` / `[password]`
- **Screen recording (≤5 min):** [URL]

## What it does

- **Tenant form** (`/`): property → unit → contact → category, with quick self-checks, follow-up questions, inline emergency prompts, up to 3 photos, and entry permission. Returns a reference number (`MR-4K7Q`).
- **Confirmation** (`/sent`): the reference number, a summary and what happens next. It reads only a short-lived signed cookie set by the submit action; nothing can be looked up by reference number.
- **Staff dashboard** (`/staff`): status counters, filters (property, category, search) kept in the URL, and requests grouped into Needs attention / In progress / Done this week.
- **Request detail:** change status (New → Scheduled → Waiting on vendor → Done), assign to In-house maintenance or a vendor, set a visit, add internal notes, view photos. Marking a request Done asks first and can save a note about the work. Every change is recorded in an activity history that can't be edited.
- **Log a phone request:** the tenant form in staff mode, saved as the signed-in staff member.
- **Vendors:** a small editable list; removing hides a vendor (with Undo) and keeps its name on old requests.

## How privacy and history are enforced

- Tenants can't read anything: row-level security gives the public (anon) role no read access to any table or photo. The tenant form writes through a server action.
- Staff pages and every server action check the session on the server (`requireStaff()`, using `getUser()`). Staff changes go through the staff member's own Supabase client, so RLS applies and history records the right person.
- Staff can change only status, assignment and visit fields (column-level grants).
- Photos are type- and size-checked on the server, stored at random paths in a private bucket, and shown to staff through signed links that expire after 5 minutes.
- History is written by database triggers and is append-only (updates, deletes and truncates are revoked and blocked by a trigger). The actor is stamped from `auth.uid()`, never from the client.
- The service-role key is only imported by `server-only` files; a build check confirms it isn't in the browser bundle.

All of this was checked against the live project; see [`docs/SECURITY_CHECK.md`](docs/SECURITY_CHECK.md).

## Running locally

```
cp .env.example .env.local     # fill in Supabase values and a random CONFIRMATION_COOKIE_SECRET
npm install
# in the Supabase SQL editor, run in order:
#   supabase/migrations/0001_init.sql
#   supabase/migrations/0002_request_tenant.sql
#   supabase/seed.sql
npm run import:units -- data/sample_units.csv
npm run create:staff -- you@example.com "Your Name" "a-strong-password"
npm run seed:demo -- you@example.com "a-strong-password"   # optional: 7 demo requests
npm run dev
```

On Windows, wrap arguments that contain spaces in double quotes, not single quotes.

## Assumptions

- Aging = open for 3+ days (`AGING_DAYS`). "Done this week" = closed in the last 7 days.
- Photos: images only (JPEG, PNG, WebP, HEIC), up to 3, 10 MB each.
- The reference number is not a secret or an access token; nothing can be looked up with it.
- The importer reads the provided `data/sample_units.csv` and maps its columns in one place (`COLUMN_MAP` in `scripts/import-units.ts`). It handles vacant units, a property name typed in different case (`Bayview flats`), duplicate rows, and warns about bad emails and phones instead of failing.
- Times are shown in the company's time zone, set by `APP_TIME_ZONE`, default `America/New_York`. That's an assumption: the property locations weren't given.
- A request is linked to a tenant only when its phone or email matches a current tenant of that unit. This is a hint for staff, not identity verification. See [`docs/DECISIONS.md`](docs/DECISIONS.md).

## Questions I asked the owner (and the answers)

| Question | Answer |
|---|---|
| Can tenants see their requests? | No. Submit-only with a reference number. |
| Verify who's submitting? | Accept all; flag mismatches with the tenant on file. |
| Emergency number and heat rule? | (000) 000-0000 for all properties; no AC above 90°F counts as an emergency. |
| Vendors? | In-house maintenance, Pest control, AC contractor, Plumber, Electrician; editable; no vendor logins. |
| Notifications? | None in v1; highlight new requests. |
| Staff roles? | One role; record every change. |

Questions I'd still ask:
- Where are the properties? Every phone number in the sample data is a 949 (Southern California) number, so the time zone should probably be `America/Los_Angeles`, not the Eastern default.
- Who should be able to reopen a Done request, and should reopening need a reason?
- How long should photos and closed requests be kept?
- Should staff be able to fix the tenant link on a request when the match is wrong (for example a roommate, or a typo in the tenant data)?

## Which parts AI wrote

Most of the code was generated with Claude (Claude Code), working one task at a time from a written spec. [`docs/AI_LOG.md`](docs/AI_LOG.md) lists every task, what was generated and how it was checked.

- **Generated:** the build plan, wireframes and design spec, the database schema (RLS, column grants, history triggers), the Next.js scaffold, every screen and component, the server actions, the import, staff and demo-data scripts, and the security check scripts.
- **Decided or changed by hand:** the scope, the visual direction and all copy; linking requests to tenants by `tenant_id` instead of a yes/no match flag; [add anything else you rewrote or reviewed line by line].
- **How security-critical parts were verified:** the schema was first run on a local Postgres with stub auth and storage schemas; then 43 checks ran against the live project as anon, as a signed-in non-staff user and as staff (results in `docs/SECURITY_CHECK.md`). Every commit passed typecheck, lint and build.

## Known issues and what I'd do next

Known issues:
- The photo type is the browser-reported MIME type; the server doesn't read file contents. The bucket's allowed types are a second check, and photos are only shown to signed-in staff.
- No rate limit on the public form or sign-in beyond Supabase Auth's own. The honeypot stops only simple bots.
- Tenant matching misses typos in the tenant data (the sample has `gmial` and `hotmial`), incomplete phone numbers and roommates not on the lease. They show as "Not on file".
- Demo data: history entries are stamped by the database with the real time, so the seeded requests' Activity shows today even when the request is days old.

Next:
- A staff action to link or change a request's tenant, recorded in history; re-match old requests after a tenant import.
- A basic rate limit on the form and sign-in; check photo contents on the server and compress on upload.
- Email/SMS updates for tenants, or a secure status link per request, if the owner wants tenants to see progress.
- Request history per unit on the detail page, to spot repeat problems.
- Out of scope for v1 by design: tenant accounts or lookup, calendars, vendor portal, analytics, multi-language, editing or deleting requests, multiple roles, dark mode, quick-assign from the dashboard.
