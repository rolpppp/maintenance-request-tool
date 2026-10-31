# Decisions

Short notes on choices that need a reason. The README's "Assumptions" and "Known issues and what I'd do next" sections are built from this file.

## Linking a request to the tenant on file

**Decision.** Every request is accepted and belongs to a unit. When the contact phone or email equals a current tenant of that unit, the request is linked to that tenant (`requests.tenant_id`). Otherwise it stays unlinked and staff see "Not on file". The typed contact details are always stored as typed. The link is set once, on the server, when the request is created.

**How comparable systems do it.**
- [AppFolio](https://www.appfolio.com/blog/tenant-online-maintenance-requests-are-here/): a request from the signed-in tenant portal creates a work order with the tenant and unit filled in automatically.
- [Property Meld](https://help.propertymeld.com/hc/en-us/articles/45827451221395-How-to-Create-Manage-and-Cancel-Meld-Requests): managers can create a request on behalf of a resident, or for work on a unit with no resident.
- [Hunt Military Communities](https://huntmilitarycommunities.com/document/work-order-entry-information) (a Yardi-era operator's guide): requests that come in by phone, email or in person are entered by staff as a work order in the management system.

All three attach the work order to a unit, and to a resident when one is known. They know the resident because the resident signed in or staff picked them. v1 has no tenant logins (owner decision), so the match is a hint, not authority.

**Limitations now.**
- Matching by phone or email is not identity verification. Anyone who knows a tenant's number "matches". It only changes a label and never grants anything.
- Typos in the tenant data (the sample file has `gmial` and `hotmial`) won't match.
- Incomplete phone numbers (`949-410`) won't match.
- Roommates and partners who are not on the lease show as "Not on file".
- Staff can't link or correct the tenant by hand (editing requests is out of scope for v1).
- `tenant_id` is set at submit time only. A later re-import of tenants doesn't re-evaluate old requests.

**Next versions.**
- A staff "link to tenant" / "change tenant" action, recorded in history.
- Tenant accounts, or a one-time code by email or SMS, for verified identity.
- Request history per tenant and unit on the detail page; flag repeat issues in the same unit.
- Re-match on import, and a contact-data quality report from the importer.
- A list of authorised occupants per unit.
