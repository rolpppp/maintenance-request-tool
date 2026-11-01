# Security check

Run on 2026-10-31 against the live Supabase project, with throwaway scripts (not committed). A temporary staff user and a temporary non-staff user were created with the service role, used, and deleted. Every write attempt used a non-existent request id, an invalid value, or a row a trigger rejects before insert, so nothing was written to the real data.

## Database and storage

| Check | How | Result |
|---|---|---|
| anon cannot read any table | `select` on all 8 tables with the anon key | Pass: `42501 permission denied` on every table |
| anon cannot write | insert into `request_events`, `requests`, `vendors`; update `requests`, `vendors`; delete `request_events` | Pass: `42501` on all |
| anon cannot call helpers | rpc `is_staff`, `gen_request_ref` | Pass: `42501` |
| anon has no storage access | list, download, sign, upload on `request-photos`; download and sign a real photo path; public URL of a real photo | Pass: all denied or not found; public URL returns 400 |
| Signed-in user who is not staff sees nothing | select on requests, tenants, events, vendors, staff; insert a phone request | Pass: 0 rows; insert blocked by RLS |
| Staff cannot edit tenant-written fields | update `description`, `contact_name`, `tenant_id` | Pass: `42501` (column grants) |
| Staff can change status, vendor, visit | update `status` on a missing id | Pass: allowed, 0 rows |
| History is append-only | staff update and delete on `request_events`; delete on `requests` | Pass: `42501` |
| Staff cannot forge history | insert a `status` event as staff | Pass: blocked by RLS (only `note` allowed) |
| Notes reach the table | insert a `note` event for a missing request | Pass: RLS allows it, the foreign key stops it (`23503`) |
| Actor cannot be chosen by the client | review of `request_events_stamp` | Pass: trigger overwrites `actor_id` and `actor_label` from `auth.uid()` (a live check would write a row) |
| Staff phone request only as `staff_phone` | insert with `source = 'tenant_form'` | Pass: blocked by RLS |
| Staff cannot link another unit's tenant | insert with a tenant from a different unit (description too short, so it can never be saved) | Pass: rejected by `requests_tenant_in_unit` (`tenant_id must belong to the request's unit`) |
| Vendor protections | update `is_in_house`; insert an in-house vendor | Pass: no column grant; blocked by RLS |
| Staff cannot read the bucket directly | download with the staff client | Pass: denied (photos only through signed URLs from the server) |

## Application

| Check | How | Result |
|---|---|---|
| Service key and cookie secret not in the browser bundle | first 10 characters of each searched for in all of `.next/static` after `npm run build` | Pass: 0 hits |
| Staff pages and actions check the session first | read every file under `src/app/staff` | Pass: the `(app)` layout, each page and each action call `requireStaff()` first. Exceptions by design: `signOut` (always allowed) and `signIn`. Server Actions are public POST endpoints, so each action re-checks rather than relying on the page |
| No `getSession()` on the server | grep | Pass: only a comment mentions it |
| Admin client only where documented | grep | Pass: tenant submit, units list on `/`, signed URLs and photo uploads after `requireStaff()`. All three importing files now start with `import 'server-only'` (fixed) |
| Validation | read | Pass: zod on every action input; the request schema is shared by browser and server |
| `/sent` never looks up by reference | read | Pass: shows only the signed cookie (HMAC, `httpOnly`, `sameSite=lax`, `secure` in production, 10 minute expiry checked on read) |
| Photos | read | Pass: type, size and count checked on the server; random path `requests/{uuid}/{uuid}.{ext}`; signed URLs last 300 s; the bucket also enforces type and size |
| Honeypot | read | Pass: a filled `website` field gets a fake success and stores nothing |
| No unsafe HTML or `any` | grep | Pass: no `dangerouslySetInnerHTML`, no `any` |

## Known limits (not fixed)

- The photo type is the browser-reported MIME type; the server does not read file contents. The bucket's allowed types add a second check, and files are only ever shown to signed-in staff.
- No rate limit on the public form or on sign-in beyond what Supabase Auth applies. The honeypot stops simple bots only.
- Public sign-ups should be disabled in the Supabase Auth settings (there is no sign-up page). A self-registered user would still see nothing, because every policy needs a row in `staff`.
- Matching a request to a tenant by phone or email is a hint, not identity (see `docs/DECISIONS.md`).
