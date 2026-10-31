# Maintenance Request Tool — Build Plan (v1)

Guiding rule from the brief: **"Keep it simple. A clean, working, secure tool matters more than lots of features."**
Acceptance test (from design feedback): a tenant can submit from a phone in about two minutes; a staff member can understand, assign and update a request within seconds.

Requirement numbers refer to the brief: (1) tenant form, (2) staff dashboard, (3) privacy, (4) history, (5) sample data.

---

## Owner's answers (settled)

| Question | Answer | What we build |
|---|---|---|
| Tenant access | Submit-only with a reference number. Tenants can't view any requests. | No tenant login and no request lookup page. |
| Verifying the submitter | Accept all; flag mismatches with the tenant on file. | Compare name/phone/email to the unit's tenant; show a "Not on file" flag on the dashboard and detail page. |
| Emergencies | One placeholder number, **(000) 000-0000**, for every property. No AC is an emergency above **90°F** inside. | Banner + an AC follow-up question "Is it over 90°F inside?" that triggers the call prompt. |
| Vendors | Short editable list: In-house maintenance, Pest control, AC contractor, Plumber, Electrician. Vendors don't log in. | `vendors` table + a small Vendors page (rename, add phone, add, remove). |
| Notifications | No emails in v1. Highlight new requests on the dashboard. | New requests: dot + bold + "New" count. |
| Staff roles | One staff role; every change recorded. | Single `staff` role; append-only `request_events`. |

## Design direction (from feedback)

- Minimal professional utility: pure white page (#FFFFFF), neutral grey panels (#F4F5F4) and borders (#E3E6E3), forest-green accent (#1E5C45), charcoal text (#1F2421). (The warm off-white from the feedback was tried and dropped.)
- Inter typography; Lucide-style icons; 8–12px radii; subtle borders and shadows; no gradients or decoration.
- All text pairs checked for 4.5:1 contrast; input borders 3:1.
- Motion only where it carries meaning (section reveal, new history entry, save toast, success check, emergency warning, photo preview).

## Decisions where the feedback and the owner/brief differ

- **"Consider token-based request lookup"** → not built. The owner said tenants can't view any requests. Listed in README as a possible v2.
- **"Scheduling"** → kept tiny: one visit date + time window on the request, recorded in history. No calendar.
- **"Vendor information"** → name + optional phone from the vendors list. No vendor accounts or messaging.

---

## 0. Foundation

- **Stack:** Next.js on Vercel, Supabase for database, staff login and photo storage.
- **Tables:** `properties`, `units`, `tenants` (from CSV) · `vendors` (seeded with the 5 above) · `requests` (+ `contact_matches_tenant`, `visit_date`, `visit_window`) · `request_photos` · `request_events` (append-only) · `staff`.
- **Data import (requirement 5):** re-runnable, no duplicates. Still waiting on the real `sample_units.csv`; build against a small made-up file until it arrives. Do **not** use or commit `Recurring_Payments.xlsx`.

## 1. Tenant request form (requirement 1)

Public, no login, one page, four steps that appear as you go.

| Step | Contents |
|---|---|
| Emergency banner (always) | Gas smell · flooding · no AC over 90°F → Call (000) 000-0000 |
| 1. Where | Property, then unit (unit numbers only, never tenant names) |
| 2. You | Name, phone, email (phone or email required; email format checked) |
| 3. What's wrong | Category list with short descriptions → quick check (if any) → follow-up chips. Emergency answers show an inline call prompt. |
| 4. Details | Description (required) · up to 3 photos with previews, remove, type/size errors (image only, ≤10 MB) · entry permission (required) · Send |

- Follow-up questions, self-checks and emergency triggers live in **one config file** (good for the live change on the call).
- Validation: inline errors next to each field plus a summary above Send; "Sending…" state while uploading.
- Confirmation: success state, reference number with Copy, "What happens next" timeline (Received → Reviewed → Repair visit → Fixed).

## 2. Staff login

- Email + password, no sign-up; accounts created by the setup script.
- Inline validation, wrong-credentials message, "Signing in…" state.
- Every staff page and action checks the session **on the server**.

## 3. Staff dashboard (requirement 2)

- Four compact status counters (New / Scheduled / Waiting on vendor / Done) that double as filters.
- Property, category and search filters; "Clear filters".
- Table, newest first; **whole row clickable**. New = dot + bold. **Aging** = open 3+ days (amber, assumption to confirm). "Not on file" flag for mismatched contacts.
- States: loading skeleton, empty ("No requests yet"), no matches, load error with Try again.

## 4. Request detail (requirement 2)

- Two columns. **Left:** what the tenant wrote, follow-up and quick-check answers, photos, tenant contact + match flag + entry permission, activity history. **Right (sticky; moves to the top on phones):** status, assignment, vendor info, visit date/window, internal note.
- Every change shows "Saving…" → "Saved" toast; a failed save shows an error toast and changes nothing.

## 5. Vendors

- One small page: rename, add phone, add, remove (hidden, not deleted, so history keeps the name). "In-house maintenance" can't be removed.

## 6. History (requirement 4)

- Database trigger writes an event on every status, assignment, visit or note change: who, what, when.
- Insert-only: no update/delete permissions on `request_events`, enforced in the database.

## 7. Privacy and security (requirement 3)

- No public read access to requests, photos or events: blocked by database row-level security, not the UI.
- Form submissions go through a server action that validates input and writes with server-side credentials.
- Photos in a private bucket; staff see them through signed URLs that expire in minutes.
- Random reference numbers; hidden spam trap and basic rate limit on the form.
- Staff routes and actions check the session server-side.

## 8. Handoff deliverables

- [ ] GitHub repo with small, clear commits
- [ ] Live link + staff demo login
- [ ] README: assumptions, owner questions + answers, which parts AI wrote, known issues / next steps
- [ ] Screen recording, 5 minutes or less

## Out of scope for v1 (README "next steps")

Tenant login or request lookup · email/SMS · scheduling calendar · vendor portal · analytics/reports · multi-language · editing or deleting requests · multiple staff roles.

## Assumptions to state in the README

- Aging = open for 3+ days.
- Photos: images only, up to 3, 10 MB each.
- "Done" counter shows the last 7 days.

## Time budget (about 5 hours)

| Module | Time |
|---|---|
| Foundation, data import, vendors seed | 45 min |
| Tenant form + confirmation | 1 h 30 min |
| Login, dashboard, detail, vendors page | 1 h 20 min |
| History, security checks | 40 min |
| README, deploy, recording | 45 min |
