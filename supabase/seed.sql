-- Vendors agreed with the owner. Safe to re-run.
insert into public.vendors (name, is_in_house, sort_order)
select v.name, v.is_in_house, v.sort_order
from (values
  ('In-house maintenance', true,  0),
  ('Pest control',         false, 10),
  ('AC contractor',        false, 20),
  ('Plumber',              false, 30),
  ('Electrician',          false, 40)
) as v(name, is_in_house, sort_order)
where not exists (select 1 from public.vendors existing where existing.name = v.name);

-- Properties, units and tenants come from the CSV: npm run import:units -- data/sample_units.csv
-- Staff accounts:                                   npm run create:staff -- email "Name" 'password'
