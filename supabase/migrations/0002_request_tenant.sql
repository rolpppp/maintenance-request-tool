-- Link a request to the tenant on file (docs/DECISIONS.md).
-- requests.tenant_id replaces the contact_matches_tenant boolean: "matches" now means
-- tenant_id is not null, so there is one source of truth and staff can see WHO matched.
-- Run after 0001; safe to re-run. Matching is a hint for staff, never proof of identity.

alter table public.requests
  add column if not exists tenant_id uuid references public.tenants (id) on delete set null;
create index if not exists requests_tenant_idx on public.requests (tenant_id);

-- Backfill existing requests with the same rule as src/lib/contact.ts: a CURRENT tenant of the
-- same unit whose phone (digits only, leading US "1" dropped from 11 digits) or lower(trim(email))
-- equals the request's. Several matches: the one matching both wins, then the oldest record.
create or replace function pg_temp.norm_phone(p text)
returns text language sql immutable as $$
  select case when length(d) = 11 and d like '1%' then substr(d, 2) else d end
  from (select regexp_replace(coalesce(p, ''), '\D', '', 'g') as d) x
$$;

update public.requests r
set tenant_id = (
  select t.id
  from public.tenants t
  where t.unit_id = r.unit_id
    and t.is_current
    and (
      (pg_temp.norm_phone(r.contact_phone) <> '' and pg_temp.norm_phone(t.phone) = pg_temp.norm_phone(r.contact_phone))
      or (btrim(coalesce(r.contact_email, '')) <> '' and lower(btrim(coalesce(t.email, ''))) = lower(btrim(r.contact_email)))
    )
  order by
    ((pg_temp.norm_phone(r.contact_phone) <> '' and pg_temp.norm_phone(t.phone) = pg_temp.norm_phone(r.contact_phone))
      and (btrim(coalesce(r.contact_email, '')) <> '' and lower(btrim(coalesce(t.email, ''))) = lower(btrim(r.contact_email)))) desc,
    t.created_at, t.id
  limit 1
)
where r.tenant_id is null;

alter table public.requests drop column if exists contact_matches_tenant;

-- The linked tenant must live in the request's unit, so a row can't point at another unit's tenant.
create or replace function public.requests_tenant_in_unit()
returns trigger
language plpgsql
as $$
begin
  if new.tenant_id is not null
     and not exists (select 1 from public.tenants where id = new.tenant_id and unit_id = new.unit_id) then
    raise exception 'tenant_id must belong to the request''s unit';
  end if;
  return new;
end;
$$;
drop trigger if exists requests_tenant_in_unit on public.requests;
create trigger requests_tenant_in_unit before insert on public.requests
  for each row execute function public.requests_tenant_in_unit();

-- No grant change needed: 0001 limits staff UPDATE to status, vendor_id, visit_date and
-- visit_window, so tenant_id can't be changed after insert. The server computes it on insert.
-- Staff (trusted, one role) could insert a phone request with a different tenant of the same
-- unit by calling the API directly; the trigger above stops any other unit's tenant.
