-- Two active vendors can't share a name (ignoring case and surrounding spaces).
-- A unique index is the reliable check: two staff saving the same name at once can't both win.
--
-- Run this first. It must return no rows, or the index below will fail to build:
--   select lower(btrim(name)) as name, count(*) from public.vendors
--   where is_active group by 1 having count(*) > 1;
-- If it returns rows, rename or remove the extra vendors on the Vendors page, then run this file.

create unique index vendors_active_name_unique on public.vendors (lower(btrim(name))) where is_active;
