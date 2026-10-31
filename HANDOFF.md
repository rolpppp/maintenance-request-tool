# Maintenance Request Tool: Design Handoff (v1)

This is the single source of truth for building v1. Read it with `AGENTS.md` (how to work) and `docs/TASKS.md` (what to build, in order).

- **Wireframes:** "Maintenance Request Wireframes" canvas: https://claude.ai/artifact/7oSGd6fDJDgm5BnaSBEtL2 (private; the owner must share it before anyone else can open it). Everything visual in that canvas is described in words below, so this file is enough on its own.
- **Product rule:** Keep it simple. A clean, working, secure tool matters more than lots of features.
- **Acceptance test:** A tenant can submit a request from a phone in about two minutes. A staff member can understand, assign and update a request within seconds.

---

## 1. Context

A property company manages about 75 rental units. Requests currently arrive by phone, text, tenant portal and in person, then get retyped into a group chat. v1 replaces that with:

1. A public **tenant request form** (no login).
2. A **staff app**: sign in, dashboard, request detail, vendors list.

Deadline: Monday, Nov 2, 2026, 11:59 PM US Eastern. Budget: about 4–5 hours of build time.

## 2. Owner decisions (final)

| Topic | Decision |
|---|---|
| Tenant access | Submit-only. Tenants get a reference number and **cannot view any request**, including their own. No lookup page. |
| Who submitted | Accept every request. Compare the contact details with the tenant on file for that unit; if they don't match, flag it for staff ("Not on file"). |
| Emergency number | **(000) 000-0000** for every property. |
| Extreme heat rule | No AC with the inside temperature **above 90°F** is an emergency. |
| Vendors | Editable list: In-house maintenance, Pest control, AC contractor, Plumber, Electrician. Vendors never log in. |
| Notifications | None in v1. New requests are highlighted on the dashboard. |
| Staff roles | One role. Every change is recorded in history. |

## 3. Scope

**In:** tenant form + confirmation, staff sign-in, dashboard, request detail, vendors page, photo viewer, optional "Mark as Done" dialog, append-only history, CSV import of properties/units/tenants.

**Out (list under "Next steps" in the README):** tenant accounts or request lookup, email/SMS, calendars, vendor portal, analytics or charts, multi-language, editing/deleting requests, multiple roles, dark mode, quick-assign from the dashboard.

## 4. Design language

**Character:** minimal professional utility with one recurring idea, the **maintenance tag**: the paper slip a technician hangs on a repaired unit. Every request carries a tag (`MR-4K7Q`) that looks the same everywhere, for tenants and staff alike. Colour always means something. No gradients, glass, illustrations, emoji or decorative charts.

### 4.1 Colour tokens (see `src/styles/tokens.css`)

| Token | Hex | Use |
|---|---|---|
| `page` | `#FFFFFF` | Page background (always pure white) |
| `surface` | `#FFFFFF` | Cards, dialogs |
| `panel` | `#F4F5F4` | Grouped content inside cards (quick-check steps, summary strips, note bubbles) |
| `fill` | `#EEF0EE` | Icon boxes, nav hover, empty photo slots, avatars |
| `hover-row` | `#F8F9F8` | Table row hover, dialog footers |
| `line` | `#E3E6E3` | Card and dialog borders, dividers |
| `line-soft` | `#EEF0EE` | Table row dividers |
| `line-strong` | `#C4C9C5` | Hover borders, tag outline |
| `field` | `#8A918C` | Input borders (3.2:1 on white, meets WCAG 1.4.11) |
| `field-hover` | `#69706B` | Input hover border |
| `ink` | `#1F2421` | Primary text |
| `ink-2` | `#3A403C` | Secondary strong text |
| `muted` | `#5C635E` | Secondary text, hints (6.2:1 on white) |
| `faint` | `#8A918C` | Disabled only |
| `accent` | `#1E5C45` | Forest green: primary buttons, links, focus, success |
| `accent-hover` | `#184C39` | Primary hover |
| `accent-tint` | `#EAF2EC` | Selected tiles/options, success panels |
| `accent-line` | `#C5DACB` | Success panel border |
| `danger` | `#B42318` | Emergency and destructive buttons, errors |
| `danger-hover` | `#912018` | Danger hover, text on danger tint |
| `danger-tint` | `#FEF1EF` | Emergency banner, error panels |
| `danger-line` | `#F6CFC9` | Emergency/error borders |
| `warn-ink` | `#8A5A00` | "Aging" and "Not on file" labels |

**Colour rules**
- Green appears only for actions, progress and success. Red appears only for emergencies, errors and destructive actions. Status colours live only inside status pills and their dots.
- Everything else is ink and grey.
- Every text pair was checked for at least 4.5:1 contrast. Keep it that way; check any new pair.

**Status colours** (pill background / text / dot):

| Status | Background | Text | Dot |
|---|---|---|---|
| New | `#FDF5E1` | `#8A5A00` | `#D29B12` |
| Scheduled | `#EEF3FB` | `#2457A6` | `#2F6BD0` |
| Waiting on vendor | `#FCF0E6` | `#A4480F` | `#D2691E` |
| Done | `#EFF1EF` | `#555B57` | `#8A918C` |

**Backdrops:** dialogs use `rgba(31,36,33,.40)` (charcoal, not black). The photo viewer uses `rgba(31,36,33,.92)`.

### 4.2 Typography

- **Inter** (Google Fonts, variable, `opsz 14..32`, weights 400–700). Fallback: `-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif`. Turn on `font-optical-sizing: auto` and antialiasing.
- Body letter-spacing `-0.011em`. Use `font-variant-numeric: tabular-nums` for all numbers, ages, times and references.

| Role | Size / line-height | Weight | Tracking |
|---|---|---|---|
| Tenant page title | 30 / 1.12 | 700 | -0.025em |
| Staff page title | 28 / 1.15 | 700 | -0.025em |
| Section heading (tenant) | 21 / 1.25 | 650 | -0.02em |
| Card heading (staff) | 15 | 650 | -0.012em |
| Step eyebrow ("Step 1 of 4") | 13 | 600, accent | – |
| Tenant body / inputs | 16 / 1.5 | 400 | – |
| Staff body | 14 / 1.5 | 400 | – |
| Labels | 15 tenant / 13–14 staff | 600 | – |
| Hints, meta | 13–14 | 400, muted | – |
| Table header | 12 | 600, muted | – |

### 4.3 Shape, spacing, elevation

- 8px spacing grid. Radii: **6** (pills, tags), **8** (chips, small buttons, staff inputs), **10** (tenant inputs, buttons, tiles), **12** (cards, dialogs). Nothing rounder except circles.
- Card: white, 1px `line` border, shadow `0 1px 2px rgba(31,36,33,.04)`. Dialog shadow: `0 12px 32px rgba(31,36,33,.16), 0 2px 6px rgba(31,36,33,.06)`.
- Control heights: tenant 48–52px; staff 40–44px. Touch targets are never under 44px on the tenant side.
- Icons: Lucide (use `lucide-react`), stroke 1.8–2, sizes 15–24px. One icon per category, used on every screen:

| Category | id | Lucide icon |
|---|---|---|
| AC / heating | `ac_heating` | `Thermometer` |
| Plumbing | `plumbing` | `Droplet` |
| Electrical | `electrical` | `Zap` |
| Pests | `pest` | `Bug` |
| Appliance | `appliance` | `WashingMachine` |
| Door / lock | `door_lock` | `KeyRound` |
| Other | `other` | `Ellipsis` |

### 4.4 Shared components

- **Tag** (signature element): inline-flex, height 22–26px (large variant 42px on the confirmation), 1px `line-strong` border, radius 6 (8 large), white, 600 weight, tabular numbers, `letter-spacing .03em`. A "punched hole" sits before the text: a 6px circle (10px large) drawn as an inset 1.5px ring in `field` grey (CSS `::before`, no extra markup).
- **Status pill:** 24–26px tall, radius 6, 6px dot plus label; colours from the status table.
- **Buttons:** primary (accent), ghost (white, `line` border), quiet (transparent), danger (red). Press feedback is `scale(.98)` over 120ms. Disabled-while-working buttons show a spinner and a verb ("Sending…", "Signing in…", "Removing…").
- **Inputs:** visible label above every field (never placeholder-only), 1px `field` border, focus border accent plus a 3px `rgba(30,92,69,.16)` ring. Error state: red border, and an error line below with an icon (`role` text in the "err" style, 14px, `#B42318`).
- **Category tile** (tenant): a full-width row with a 36px icon box, label and one-line hint. Selected: accent border plus inset 1px, `accent-tint` background, and a 20px green check badge top-right.
- **Chip** (follow-up answer): 44px tall, radius 8, white with a `line` border. Selected: ink background with white text. Selected *emergency* answer: red background.
- **Option card** (entry permission): a radio-style card with a dot ring; selected uses the tile treatment.
- **Toast** (staff): bottom-centre, charcoal `#1F2421` with white text, radius 10. "Saving…" (spinner) → "Saved · Status is Done" (green check, auto-hides after 2.2s). Error toast is `#912018`: "Couldn't save. Nothing changed." plus "Try again".
- **Summary strip** (dialogs): `panel` background with a 1px `line-soft` border, holding the tag, title, unit and "current → new" status.

## 5. Screens

### 5.1 Tenant request form (`/`): phone first, one page

Max content width about 480px, centred; 16px side padding on phones. Sections **appear in order as the tenant completes the previous one**. Answers from a section that gets hidden (for example after switching category) are cleared before submitting.

1. **Header:** wrench mark plus "[Company name] Maintenance"; title "Something need fixing?"; subtitle "Tell us what's wrong and it goes straight to the maintenance team."; meta line with a clock icon: "About 2 minutes · No account needed".
2. **Emergency banner** (always visible, danger tint): heading "Emergency? Call now. Don't use this form."; bullets "Gas smell", "Flooding or water spreading", "No AC and it's over 90°F inside"; a full-width red button "Call (000) 000-0000" (`tel:` link).
3. **Step 1 of 4 · Where is the problem?** Property select, then Unit select (disabled until a property is chosen; the prompt reads "Choose a property first"). **Unit options show unit numbers only, never tenant names.**
4. **Step 2 of 4 · How can we reach you?** (appears after a unit is chosen) Name, Phone, Email; hint "A phone number or an email is enough." Use `autocomplete` and `inputmode` attributes.
5. **Step 3 of 4 · What's wrong?** (appears once there's a name plus a phone or email) Seven category tiles from `src/config/categories.ts`.
   - **Quick check** (only for categories that have one: AC, electrical, appliance, door/lock): a card headed "Try this first", subtitle "It fixes this more often than you'd think.", numbered steps on `panel`, then "Did that fix it?" with **"Yes, it's fixed"** (ghost) and **"No, still broken"** (primary).
     - Yes → green success card: "Great, glad it's working." / "Nothing else to do. If it stops again, come back any time." plus a ghost button "It stopped working again". Nothing is submitted.
     - No → note "Tried it, still broken. We'll pass that on to the team." and the follow-ups appear.
   - **Follow-up questions:** chips per question. Optional questions show "· optional".
   - **Inline emergency prompt:** when an answer marked `emergency: true` is selected, show a red box ("This is an emergency" plus the category's text) with a red "Call (000) 000-0000 now" button. The tenant may still continue the form.
6. **Step 4 of 4 · A few more details:**
   - Description (required, at least 5 characters). Hint: "Where in the unit, when it started, anything you've noticed."
   - Photos (optional, up to 3): a 3-column grid with a dashed "Add photo" tile; thumbnails preview immediately (object URL) with a remove button. Errors: "That file isn't a photo. Choose a JPG, PNG or HEIC image." / "That photo is over 10 MB. Try a smaller one." Hint: "A close-up and one wider shot help the team bring the right parts."
   - **"If no one's home, may staff enter?"** (required): option cards "Yes, you may enter" (sub-text "Usually the fastest way to get it fixed.") / "No, contact me first" (sub-text "We'll arrange a time when you're home.").
   - **Send request** (full width). If invalid: inline errors plus a summary above the button ("2 things need fixing above before you can send."). While sending: a disabled button with spinner, "Sending your request…".
   - Privacy line with a lock icon: "Only maintenance staff can see your request and photos."
   - A hidden honeypot field (visually hidden, `tabindex="-1"`, `autocomplete="off"`); if it's filled, silently pretend success.

**Validation copy:** email "Check the email address, it looks incomplete." · description "Tell us a little about the problem." · entry "Choose one so the team knows how to plan the visit."

### 5.2 Confirmation (`/sent?ref=MR-XXXX`)

- Card with an animated check, title "Request sent", "Thanks, {first name}. The maintenance team has it now."
- "Your reference number": the **large tag** plus a **Copy** button (it becomes "Copied ✓" for 2s). Line below: "Keep it in case you call us about this request. Save a screenshot if that's easier."
- Summary list: Where, Problem, Entry, Photos.
- "What happens next" vertical timeline: **Received** (done, "Just now") → **The team reviews it** (current, "They'll call or email you to set a time.") → **Repair visit** → **Fixed** ("The request is closed.").
- Ghost button "Report another problem"; line "Getting worse or unsafe? Call (000) 000-0000".
- The page shows only what it receives from the submit response or a short-lived signed cookie. **It must not fetch a request by reference number** (no lookup).

### 5.3 Staff sign in (`/staff/login`)

White card, max 400px: "Staff sign in" / "See and manage every maintenance request." Email and password with inline errors. Wrong credentials: banner "That email and password don't match. Try again, or ask the account owner to reset it." Loading: "Signing in…". Footer: "Forgot your password? Ask the account owner to reset it." Under the card: "Tenant? You don't need an account. Report a problem". No sign-up.

### 5.4 Staff dashboard (`/staff`)

- **Top bar:** brand · nav (Requests, Vendors) · avatar initials (neutral `fill`) plus name · Sign out.
- **Title** "Requests" with summary "{open} open · {n} need attention"; primary button "+ Log a phone request" (opens the same form in staff mode, `source = staff_phone`).
- **Four status counters** (New, Scheduled, Waiting on vendor, Done). Each shows a dot, label, count and a short note ("2 with no one on it" / "1 aging" / "This week"). Clicking one filters by that status; clicking it again clears the filter. Use `aria-pressed`.
- **Filters:** Property, Category, Search (reference, unit or tenant), "Clear filters", plus "Showing x of y".
- **Table** grouped into sections (rows sorted newest first within each):
  1. **Needs attention**: status New, or open 3+ days ("aging"). When empty: "Nothing needs attention right now."
  2. **In progress**: Scheduled or Waiting on vendor, not aging.
  3. **Done this week**.
- **Columns:**
  - **Request:** a new-dot (amber) for New, the title (bold if New), and below it the tag plus submitted time ("Today, 10:44 AM").
  - **Where:** "Property · Unit", tenant name, and a "⚠ Not on file" warn label when the contact doesn't match.
  - **Category:** icon box plus name.
  - **Status:** the pill; for Scheduled rows, add the visit below it ("Today, 12–5", "Tomorrow morning").
  - **Who's on it:** vendor name or "No one yet" (muted); a "Waiting since Wed" / "Fixed Fri" sub-line.
  - **Open for:** "25 min", "2 hours", "3 days"; amber with an "Aging" clock label when aging.
- **Whole row is clickable:** a real `<a>` on the title stretched over the row with `::after`; the focus ring is drawn on the row.
- **States:** loading skeleton rows (gentle pulse), empty ("All caught up" / "No requests right now. New ones from the tenant form land here, and so do the phone requests you log."), no filter matches (with "Clear filters"), load error ("Couldn't load requests" / "Check your connection. Nothing was lost." / "Try again").

### 5.5 Request detail (`/staff/requests/[ref]`)

- Back link "‹ All requests". Header: tag, status pill, "Open 2 hours"; category icon box plus title; meta "Maple Court · Unit 2B · AC / heating · Sent today at 9:12 AM from the tenant form".
- **Two columns** (left `flex: 999 1 560px`, right `flex: 1 1 360px`, gap 20). On screens narrower than 960px the right column moves **above** the left column.
- **Left:**
  - **From the tenant:** description (16px), then a definition list of the follow-up answers and the quick-check result.
  - **Photos · n:** thumbnails 168×126 that open the photo viewer. Caption with a lock icon: "Private. Shown only to signed-in staff through links that expire in a few minutes."
  - **Tenant:** name, phone (`tel:`), email. Either "✓ Matches the tenant on file for 2B", or a warn box: "Doesn't match the tenant on file. On file for 2B: {name}, {phone}. Check who's asking before entering." Next to it, an entry permission panel (neutral `panel`): "Staff may enter" / "Jordan said it's fine to go in if no one's home." (or "Contact first").
  - **Activity** (with "🔒 Recorded automatically · can't be edited"): a vertical timeline, newest first. Each entry: **who** + sentence + time on the right. Notes show in a `panel` bubble.
- **Right (sticky on desktop):**
  - **Status:** four toggle buttons in a 2×2 grid, each with its dot; the current one has an ink border.
  - **Assigned to:** select with "No one yet" plus active vendors. If an outside vendor is chosen, a strip shows "{Vendor} · {phone or 'No phone on file'}" and an "Edit vendors" link.
  - **Visit:** date input plus time window (Any time / Morning (8–12) / Afternoon (12–5)); a plain-language line below: "Today, 12–5", "Tomorrow morning", "No visit set yet".
  - **Internal note:** textarea ("Visible to staff only"), helper "Tenants never see notes.", and "Add note" (disabled until there's text).
- Every change → toast "Saving…" → "Saved · …", plus a new Activity entry. A failed save → error toast, and no change is shown.

### 5.6 Vendors (`/staff/vendors`)

Title "Vendors" / "Who requests can be assigned to. Vendors don't log in; this list is for your team." A table with inline-editable Name and Phone, plus Remove (In-house maintenance shows "Your team" and can't be removed). An add row: name, phone (optional), "Add". Footnote: "Removing a vendor only hides it from the list. Requests already assigned to it keep the name in their history." Removing asks for confirmation (§5.7).

### 5.7 Dialogs

Desktop: a centred dialog over the 40% charcoal backdrop. Phone: a bottom sheet (top corners 12px, grab handle, slides up). The footer is a `hover-row` band with a top hairline; desktop buttons go Cancel then main action (right-aligned); phone buttons stack full width, main action on top. Use `role="dialog"` (`alertdialog` for destructive), `aria-modal`, a focus trap, Escape to close, and return focus to the trigger.

1. **Photo viewer:** 92% backdrop; top bar with "MR-4K7Q · AC blowing warm air", "Maple Court · Unit 2B · Photo 1 of 2", and Download and Close buttons; previous/next arrows (arrow keys too); footer "Private link · expires in 5 minutes". Phone: full screen, tap or swipe for the next photo, dots.
2. **Remove vendor:** red trash badge, "Remove {vendor}?", "It won't appear in the assign list anymore. Requests already assigned to it keep the name in their history." Summary strip: "{n} open requests are assigned to {vendor}. They stay assigned." Buttons Cancel / **Remove vendor** (danger). Then a success state "{vendor} removed" with **Undo**.
3. **Mark as Done** (optional; build it last): green check badge, "Mark as Done?", "This closes the request. You can reopen it any time." Summary strip: tag · title · unit · "Scheduled → Done". Optional textarea "What was done? · optional, staff only" (saved as a note). Buttons Cancel / **Mark as Done**.

## 6. Motion (only these)

Easing: `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`; drawer `cubic-bezier(0.32, 0.72, 0, 1)`. Animate `transform` and `opacity` only. Under `prefers-reduced-motion: reduce`, every animation below becomes a 150ms opacity fade, and spinners slow down.

| Where | Motion |
|---|---|
| Tenant form sections appearing | translateY(8px) + fade, 280ms ease-out |
| Inline emergency prompt | translateY(-4px) + fade, 200ms |
| Photo thumbnail added | scale(.96) + fade, 200ms |
| "Glad it's working" check | scale(.9) + fade, 450ms, `cubic-bezier(0.34,1.45,0.64,1)`, 120ms delay |
| Confirmation card | translateY(16px) + fade, 450ms; tick draws (stroke-dashoffset) 350ms after 200ms; rest fades in at 400ms |
| New Activity entry (only the newest) | translateY(-6px) + fade, 220ms |
| Status pill change | background/colour transition, 150ms |
| Toast | translate(-50%, 8px) + fade, 200ms |
| Dialog open | scale(.97) + fade, 200ms; bottom sheet translateY(100%) → 0, 300ms drawer easing |
| Press feedback | scale(.97–.98), 120ms |
| Skeleton | opacity pulse, 1.4s |

**Do not animate:** dashboard rows on filter or tab change, page loads (including sign-in), or status-tab switching. No shake effects.

## 7. Accessibility

- WCAG 2.1 AA. Text at least 4.5:1, UI boundaries at least 3:1, visible focus (2px accent outline, 2px offset).
- Real `<button>`, `<a>`, `<label>`, `<fieldset>`/`<legend>` for chip groups and option cards. Use `aria-pressed` on toggles and `aria-invalid` + `aria-describedby` on fields with errors. Use `role="alert"` for error summaries and emergency prompts, and `role="status"` for toasts and success.
- Every icon-only button has an `aria-label`; decorative SVGs use `aria-hidden="true"`.
- Colour is never the only signal: status has a label, aging has a label, selection has a check or border.
- Layout works at 375px wide with no horizontal page scroll; wide tables scroll inside their own box.

## 8. Security requirements (non-negotiable)

1. **Tenants can never read requests or photos.** The anon role has no SELECT on any table. The public form only inserts, through a server action using the service-role key on the server.
2. **Staff access** goes through Supabase Auth with a session check on the server for every staff page and action. On the server, use `supabase.auth.getUser()` or `getClaims()`, never `getSession()`.
3. **Database row-level security** is on for every table. Staff policies use an `is_staff()` helper. Staff can update only `status`, `vendor_id`, `visit_date` and `visit_window` (column grants).
4. **Photos:** a private bucket; the server checks type (JPEG/PNG/WebP/HEIC) and size (≤10 MB, ≤3 per request); staff view them through signed URLs that expire after 5 minutes, created on the server after the staff check. Store photos at random paths that don't reveal the request.
5. **History is append-only:** a database trigger writes events; UPDATE/DELETE/TRUNCATE are revoked and blocked by trigger; the actor is stamped from `auth.uid()`.
6. Server-side validation (zod) for every input, length limits matching the database checks, a honeypot, and random reference numbers (`MR-` + 4 characters from an unambiguous alphabet).
7. Secrets only in environment variables; the service-role key is never sent to the browser (`server-only` imports).

## 9. Data model (summary)

See `supabase/migrations/0001_init.sql`. Tables: `properties`, `units`, `tenants`, `staff`, `vendors`, `requests`, `request_photos`, `request_events`. Enums: `request_status`, `request_category`, `visit_window`.

## 10. Assumptions to state in the README

- Aging = open for 3+ days. "Done this week" = closed in the last 7 days.
- Photos: images only, up to 3, 10 MB each.
- The reference number is not a secret or an access token (nothing can be looked up with it).
- The real `sample_units.csv` was not received; the importer was built against `data/sample_units.example.csv` and maps columns in one place.
- Times are shown in the company's time zone, set by `APP_TIME_ZONE`, default `America/New_York`. That default is an assumption, since the properties' location was not given.
