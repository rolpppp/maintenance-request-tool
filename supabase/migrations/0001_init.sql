-- Maintenance Request Tool: initial schema
-- Security model:
--   * anon (public) role: no access to any table or storage object. The tenant form
--     writes through a server action that uses the service-role key.
--   * authenticated users who have a row in public.staff: read everything, change only
--     status / vendor / visit on requests, add notes, manage vendors.
--   * request_events is append-only: written by triggers (plus staff notes), never
--     updated or deleted.

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
create type public.request_status as enum ('new', 'scheduled', 'waiting_on_vendor', 'done');
create type public.request_category as enum ('ac_heating', 'plumbing', 'electrical', 'pest', 'appliance', 'door_lock', 'other');
create type public.visit_window as enum ('any', 'morning', 'afternoon');

-- ---------------------------------------------------------------------------
-- Reference data (loaded by scripts/import-units.ts)
-- ---------------------------------------------------------------------------
create table public.properties (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique check (char_length(name) between 1 and 120),
  address     text check (char_length(address) <= 240),
  created_at  timestamptz not null default now()
);

create table public.units (
  id           uuid primary key default gen_random_uuid(),
  property_id  uuid not null references public.properties (id) on delete restrict,
  unit_number  text not null check (char_length(unit_number) between 1 and 20),
  created_at   timestamptz not null default now(),
  unique (property_id, unit_number)
);

create table public.tenants (
  id          uuid primary key default gen_random_uuid(),
  unit_id     uuid not null references public.units (id) on delete cascade,
  full_name   text not null check (char_length(full_name) between 1 and 120),
  phone       text check (char_length(phone) <= 40),
  email       text check (char_length(email) <= 254),
  is_current  boolean not null default true,
  created_at  timestamptz not null default now(),
  unique (unit_id, full_name)
);

-- ---------------------------------------------------------------------------
-- People
-- ---------------------------------------------------------------------------
create table public.staff (
  user_id       uuid primary key references auth.users (id) on delete cascade,
  display_name  text not null check (char_length(display_name) between 1 and 80),
  created_at    timestamptz not null default now()
);

create table public.vendors (
  id           uuid primary key default gen_random_uuid(),
  name         text not null check (char_length(name) between 1 and 80),
  phone        text check (char_length(phone) <= 40),
  is_in_house  boolean not null default false,
  is_active    boolean not null default true,   -- "Remove" sets this to false
  sort_order   integer not null default 100,
  created_at   timestamptz not null default now()
);
create unique index vendors_single_in_house on public.vendors (is_in_house) where is_in_house;

-- ---------------------------------------------------------------------------
-- Requests
-- ---------------------------------------------------------------------------
create or replace function public.gen_request_ref()
returns text
language plpgsql
volatile
set search_path = public, extensions
as $$
declare
  -- No 0/O, 1/I/L: easy to read out over the phone.
  alphabet constant text := '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  bytes bytea := extensions.gen_random_bytes(4);
  result text := 'MR-';
  i int;
begin
  for i in 0..3 loop
    result := result || substr(alphabet, (get_byte(bytes, i) % length(alphabet)) + 1, 1);
  end loop;
  return result;  -- uniqueness enforced by the column; the server retries on conflict
end;
$$;

create table public.requests (
  id                      uuid primary key default gen_random_uuid(),
  ref                     text not null unique default public.gen_request_ref()
                            check (ref ~ '^MR-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}$'),
  unit_id                 uuid not null references public.units (id) on delete restrict,
  contact_name            text not null check (char_length(contact_name) between 1 and 120),
  contact_phone           text check (char_length(contact_phone) <= 40),
  contact_email           text check (char_length(contact_email) <= 254),
  contact_matches_tenant  boolean not null default false,
  category                public.request_category not null,
  answers                 jsonb not null default '{}'::jsonb check (jsonb_typeof(answers) = 'object'),
  quick_check_tried       boolean,               -- null when the category has no quick check
  emergency_flag          boolean not null default false,
  description             text not null check (char_length(description) between 5 and 4000),
  entry_allowed           boolean not null,
  source                  text not null default 'tenant_form' check (source in ('tenant_form', 'staff_phone')),
  status                  public.request_status not null default 'new',
  vendor_id               uuid references public.vendors (id) on delete restrict,
  visit_date              date,
  visit_window            public.visit_window not null default 'any',
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  closed_at               timestamptz,
  constraint contact_present check (
    coalesce(nullif(btrim(contact_phone), ''), nullif(btrim(contact_email), '')) is not null
  )
);
create index requests_status_created_idx on public.requests (status, created_at desc);
create index requests_unit_idx on public.requests (unit_id);

create table public.request_photos (
  id            uuid primary key default gen_random_uuid(),
  request_id    uuid not null references public.requests (id) on delete restrict,
  storage_path  text not null unique,
  content_type  text not null check (content_type in ('image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif')),
  size_bytes    integer not null check (size_bytes > 0 and size_bytes <= 10485760),
  created_at    timestamptz not null default now()
);
create index request_photos_request_idx on public.request_photos (request_id);

create table public.request_events (
  id           bigint generated always as identity primary key,
  request_id   uuid not null references public.requests (id) on delete restrict,
  actor_id     uuid references auth.users (id) on delete set null,
  actor_label  text not null check (char_length(actor_label) between 1 and 140),
  kind         text not null check (kind in ('created', 'status', 'assignment', 'visit', 'note')),
  from_value   text,
  to_value     text,
  note         text check (note is null or char_length(note) between 1 and 4000),
  created_at   timestamptz not null default now(),
  constraint note_only_on_note check ((kind = 'note') = (note is not null))
);
create index request_events_request_idx on public.request_events (request_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.staff where user_id = auth.uid());
$$;

create or replace function public.current_staff_label()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select display_name from public.staff where user_id = auth.uid()), 'Staff');
$$;

-- ---------------------------------------------------------------------------
-- Triggers: timestamps, photo limit, history
-- ---------------------------------------------------------------------------
create or replace function public.requests_touch()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  if new.status = 'done' and old.status is distinct from 'done' then
    new.closed_at := now();
  elsif new.status <> 'done' then
    new.closed_at := null;
  end if;
  return new;
end;
$$;
create trigger requests_touch before update on public.requests
  for each row execute function public.requests_touch();

create or replace function public.request_photos_limit()
returns trigger
language plpgsql
as $$
begin
  if (select count(*) from public.request_photos where request_id = new.request_id) >= 3 then
    raise exception 'A request can have at most 3 photos';
  end if;
  return new;
end;
$$;
create trigger request_photos_limit before insert on public.request_photos
  for each row execute function public.request_photos_limit();

-- Stamp who did it from the session, never from the client.
create or replace function public.request_events_stamp()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.created_at := now();
  if auth.uid() is not null then
    new.actor_id := auth.uid();
    new.actor_label := public.current_staff_label();
  else
    new.actor_id := null;   -- tenant form (service role)
  end if;
  return new;
end;
$$;
create trigger request_events_stamp before insert on public.request_events
  for each row execute function public.request_events_stamp();

-- Append-only: block every change, even from privileged roles.
create or replace function public.request_events_forbid_change()
returns trigger
language plpgsql
as $$
begin
  raise exception 'request_events is append-only';
end;
$$;
create trigger request_events_no_update before update or delete on public.request_events
  for each row execute function public.request_events_forbid_change();
create trigger request_events_no_truncate before truncate on public.request_events
  for each statement execute function public.request_events_forbid_change();

create or replace function public.requests_log_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.request_events (request_id, actor_label, kind, to_value)
  values (
    new.id,
    case when new.source = 'staff_phone' then public.current_staff_label()
         else new.contact_name || ' (tenant form)' end,
    'created',
    new.status::text
  );
  return new;
end;
$$;
create trigger requests_log_insert after insert on public.requests
  for each row execute function public.requests_log_insert();

create or replace function public.requests_log_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  who text := public.current_staff_label();
begin
  if new.status is distinct from old.status then
    insert into public.request_events (request_id, actor_label, kind, from_value, to_value)
    values (new.id, who, 'status', old.status::text, new.status::text);
  end if;

  if new.vendor_id is distinct from old.vendor_id then
    -- Store names, so history still reads correctly after a vendor is renamed or removed.
    insert into public.request_events (request_id, actor_label, kind, from_value, to_value)
    values (
      new.id, who, 'assignment',
      (select name from public.vendors where id = old.vendor_id),
      (select name from public.vendors where id = new.vendor_id)
    );
  end if;

  if new.visit_date is distinct from old.visit_date or new.visit_window is distinct from old.visit_window then
    insert into public.request_events (request_id, actor_label, kind, from_value, to_value)
    values (
      new.id, who, 'visit',
      nullif(concat_ws(' ', old.visit_date::text, nullif(old.visit_window::text, 'any')), ''),
      nullif(concat_ws(' ', new.visit_date::text, nullif(new.visit_window::text, 'any')), '')
    );
  end if;

  return new;
end;
$$;
create trigger requests_log_update after update on public.requests
  for each row execute function public.requests_log_update();

-- ---------------------------------------------------------------------------
-- Privileges + row level security
-- ---------------------------------------------------------------------------
alter table public.properties     enable row level security;
alter table public.units          enable row level security;
alter table public.tenants        enable row level security;
alter table public.staff          enable row level security;
alter table public.vendors        enable row level security;
alter table public.requests       enable row level security;
alter table public.request_photos enable row level security;
alter table public.request_events enable row level security;

-- Explicit table privileges (don't rely on platform defaults). RLS below narrows them.
revoke all on public.properties, public.units, public.tenants, public.staff, public.vendors,
              public.requests, public.request_photos, public.request_events from anon, authenticated;
grant all on public.properties, public.units, public.tenants, public.staff, public.vendors,
             public.requests, public.request_photos, public.request_events to service_role;
grant select on public.properties, public.units, public.tenants, public.staff, public.vendors,
                public.requests, public.request_photos, public.request_events to authenticated;
grant insert on public.requests, public.request_events, public.vendors to authenticated;
-- anon (the public) gets nothing, even if a policy is added by mistake.

-- Staff: read everything.
create policy staff_read on public.properties     for select to authenticated using (public.is_staff());
create policy staff_read on public.units          for select to authenticated using (public.is_staff());
create policy staff_read on public.tenants        for select to authenticated using (public.is_staff());
create policy staff_read on public.staff          for select to authenticated using (public.is_staff());
create policy staff_read on public.vendors        for select to authenticated using (public.is_staff());
create policy staff_read on public.requests       for select to authenticated using (public.is_staff());
create policy staff_read on public.request_photos for select to authenticated using (public.is_staff());
create policy staff_read on public.request_events for select to authenticated using (public.is_staff());

-- Requests: staff may log phone requests and change only status / vendor / visit.
create policy staff_insert_phone on public.requests for insert to authenticated
  with check (public.is_staff() and source = 'staff_phone' and status = 'new');
create policy staff_update on public.requests for update to authenticated
  using (public.is_staff()) with check (public.is_staff());
grant update (status, vendor_id, visit_date, visit_window) on public.requests to authenticated;

-- Notes: staff may add note events only (who/when are stamped by trigger).
create policy staff_add_note on public.request_events for insert to authenticated
  with check (public.is_staff() and kind = 'note');

-- Vendors: staff may add and edit; "remove" is is_active = false.
create policy staff_insert on public.vendors for insert to authenticated
  with check (public.is_staff() and is_in_house = false);
create policy staff_update on public.vendors for update to authenticated
  using (public.is_staff()) with check (public.is_staff());
grant update (name, phone, is_active, sort_order) on public.vendors to authenticated;

-- Keep the in-house vendor active.
create or replace function public.vendors_keep_in_house()
returns trigger
language plpgsql
as $$
begin
  if old.is_in_house and not new.is_active then
    raise exception 'In-house maintenance cannot be removed';
  end if;
  return new;
end;
$$;
create trigger vendors_keep_in_house before update on public.vendors
  for each row execute function public.vendors_keep_in_house();

-- Helper functions: not callable by the public role.
revoke execute on function public.is_staff(), public.current_staff_label(), public.gen_request_ref() from public, anon;
grant execute on function public.is_staff(), public.current_staff_label(), public.gen_request_ref() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Storage: private bucket, no policies => only the service role can read or write.
-- Staff see photos through signed URLs created on the server after requireStaff().
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'request-photos', 'request-photos', false, 10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do nothing;
