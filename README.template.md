# Maintenance Request Tool

A simple tool for a ~75-unit rental company: tenants report problems through one phone-friendly form, and staff track, assign and close them on one dashboard.

- **Live app:** [URL]
- **Staff demo login:** `[email]` / `[password]`
- **Screen recording (≤5 min):** [URL]

## What it does

- **Tenant form** (`/`): property → unit → contact → category, with quick self-checks, follow-up questions, inline emergency prompts, up to 3 photos, and entry permission. Returns a reference number.
- **Staff dashboard** (`/staff`): requests grouped into Needs attention / In progress / Done this week; filter by property, status and category.
- **Request detail:** change status (New → Scheduled → Waiting on vendor → Done), assign to In-house maintenance or a vendor, set a visit, add internal notes. Every change is recorded in an activity history that can't be edited.
- **Vendors:** a small editable list.

## How privacy and history are enforced

- Tenants can't read anything: the database's row-level security gives the public (anon) role no read access to any table or photo. The form writes through a server action.
- Staff pages check the session on the server. Staff can change only status, assignment and visit fields (column-level grants).
- Photos are in a private bucket and are shown to staff through signed links that expire after 5 minutes.
- History is written by database triggers and is append-only (updates and deletes are revoked and blocked by a trigger).

## Running locally

```
cp .env.example .env.local     # fill in Supabase values
npm install
# run supabase/migrations/0001_init.sql and supabase/seed.sql in the Supabase SQL editor
npm run import:units -- data/sample_units.csv
npm run create:staff -- you@example.com "Your Name" "a-strong-password"
npm run dev
```

## Assumptions

- [Fill from HANDOFF §10, plus anything decided while building.]

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
- [e.g. Where are the properties, so times and heat rules match local code?]
- [e.g. Who should be able to reopen a Done request?]
- [e.g. How long should photos be kept?]

## Which parts AI wrote

[Summarise docs/AI_LOG.md honestly: what was generated (scaffolding, components, SQL drafts, copy), what I reviewed or rewrote by hand, and how I verified security-critical parts.]

## Known issues and what I'd do next

- [Known issues found during testing]
- Next: email/SMS updates for tenants, a secure status link per request (if the owner wants it), a basic rate limit on the form, photo compression on upload, vendor contact details on assignment, an audit export.
