# Open questions for the owner

Questions that came up while building and would change the scope of v1. Nothing here is built yet.

## Should tenants see their request's progress?

**Asked:** when staff schedule a visit, should the tenant see it?

**Today:** no. The owner chose submit-only (HANDOFF §2): tenants get a reference number and can't view any request, including their own. The confirmation page shows a one-time snapshot from a 10-minute cookie, and its "What happens next" timeline describes the process, not live status. Staff tell the tenant about the visit by phone or email ("They'll call or email you to set a time.").

**Options if the owner wants it (v2):**
1. **Private status link per request.** The confirmation page shows a long random link (not the reference number) that opens a read-only status page: status, visit day and window, nothing else (no notes, vendor, photos or other tenants). Needs a token column stored hashed, a public page that reads one request by token on the server, and an expiry once the request has been Done for a while. Risk: anyone with the link sees the status, so it must never show personal details.
2. **Text or email updates** when staff schedule or close a request. Needs an SMS/email provider and consent wording; out of scope for v1 (no email/SMS).
3. **Tenant accounts.** The most reliable identity, and the most work. The owner ruled it out for v1.

**Recommendation:** option 1 if the owner wants it, because it keeps "no accounts" and shows only what the tenant already knows plus the visit time.
