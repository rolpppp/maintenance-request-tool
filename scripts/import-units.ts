/**
 * Import properties, units and tenants from a CSV. Safe to re-run (upserts, no duplicates).
 *
 *   npm run import:units -- data/sample_units.csv [--dry-run]
 *   (package.json: "import:units": "tsx --env-file=.env.local scripts/import-units.ts")
 *
 * COLUMN_MAP is the only place that knows the CSV headers. Set an optional column to null
 * when the file doesn't have it. Rules:
 *  - A row with no tenant name is a vacant unit: the unit is created, no tenant.
 *  - Property names match case-insensitively ("Bayview flats" = "Bayview Flats"; first spelling wins).
 *  - Rows missing a property or unit, or breaking a database length limit, are skipped and reported.
 *  - Suspicious emails/phones are imported as-is and reported (staff matching just won't match them).
 *  - Tenants of an imported unit who are no longer in the CSV are marked is_current = false.
 *  - --dry-run parses and prints the plan without touching the database.
 */
import { readFileSync } from 'node:fs';
import { parse } from 'csv-parse/sync';
import { createClient } from '@supabase/supabase-js';

const COLUMN_MAP: Record<'propertyName' | 'propertyAddress' | 'unitNumber' | 'tenantName' | 'tenantPhone' | 'tenantEmail' | 'status', string | null> = {
  propertyName: 'property',
  propertyAddress: null, // optional: the sample file has no address column
  unitNumber: 'unit',
  tenantName: 'tenant_name', // optional (vacant units)
  tenantPhone: 'phone', // optional
  tenantEmail: 'email', // optional
  status: 'status', // optional; only used to flag "vacant" rows that still list a tenant
};

// Mirrors the CHECK constraints in 0001_init.sql.
const MAX = { property: 120, address: 240, unit: 20, name: 120, phone: 40, email: 254 };

type Row = Record<string, string>;
type TenantInput = { unit_id: string; full_name: string; phone: string | null; email: string | null; is_current: true };

const clean = (value: string | undefined): string | null => (value ?? '').trim() || null;
const looksLikeEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const looksLikePhone = (p: string) => p.replace(/\D/g, '').length >= 10;

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const file = args.find((a) => !a.startsWith('--'));
  if (!file) throw new Error('Usage: npm run import:units -- path/to/file.csv [--dry-run]');

  const rows: Row[] = parse(readFileSync(file), { columns: true, skip_empty_lines: true, trim: true, bom: true });
  const required = [COLUMN_MAP.propertyName, COLUMN_MAP.unitNumber];
  const missing = required.filter((c): c is string => c !== null && !(rows[0] && c in rows[0]));
  if (missing.length) throw new Error(`CSV is missing required column(s): ${missing.join(', ')}. Update COLUMN_MAP.`);
  const get = (r: Row, key: keyof typeof COLUMN_MAP) => clean(COLUMN_MAP[key] ? r[COLUMN_MAP[key]] : undefined);

  // Parse every row into plain values first; no database needed for this part.
  const warnings: string[] = [];
  const properties = new Map<string, { name: string; address: string | null }>(); // key: lower-case name
  const units = new Map<string, { propertyKey: string; unit: string }>(); // key: propertyKey|unit
  const tenants = new Map<string, { unitKey: string; name: string; phone: string | null; email: string | null }>();
  let skipped = 0;

  rows.forEach((r, i) => {
    const line = i + 2; // header is line 1
    const property = get(r, 'propertyName');
    const unit = get(r, 'unitNumber');
    const address = get(r, 'propertyAddress');
    const name = get(r, 'tenantName');
    const phone = get(r, 'tenantPhone');
    const email = get(r, 'tenantEmail')?.toLowerCase() ?? null;

    const problem = !property || !unit ? 'missing property or unit'
      : property.length > MAX.property || unit.length > MAX.unit || (address?.length ?? 0) > MAX.address ||
        (name?.length ?? 0) > MAX.name || (phone?.length ?? 0) > MAX.phone || (email?.length ?? 0) > MAX.email
        ? 'a value is longer than the database allows'
        : null;
    if (problem || !property || !unit) {
      skipped++;
      warnings.push(`line ${line}: skipped, ${problem}`);
      return;
    }

    const propertyKey = property.toLowerCase();
    if (!properties.has(propertyKey)) properties.set(propertyKey, { name: property, address });
    const unitKey = `${propertyKey}|${unit}`;
    units.set(unitKey, { propertyKey, unit });
    if (!name) return; // vacant

    if (/^vacant$/i.test(get(r, 'status') ?? '')) warnings.push(`line ${line}: ${property} ${unit} is marked vacant but lists ${name}, imported as a tenant`);
    if (email && !looksLikeEmail(email)) warnings.push(`line ${line}: ${name} (${property} ${unit}) has an invalid-looking email "${email}", imported as-is`);
    if (phone && !looksLikePhone(phone)) warnings.push(`line ${line}: ${name} (${property} ${unit}) has an incomplete phone "${phone}", imported as-is`);
    tenants.set(`${unitKey}|${name}`, { unitKey, name, phone, email });
  });

  const report = (extra: string) => {
    console.log(`${extra}${properties.size} properties, ${units.size} units, ${tenants.size} tenants from ${rows.length} rows (${skipped} skipped).`);
    if (warnings.length) console.log(`\n${warnings.length} warning(s):\n${warnings.map((w) => `  - ${w}`).join('\n')}`);
  };
  if (dryRun) return report('Dry run, nothing written. Would import ');

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  const db = createClient(url, key, { auth: { persistSession: false } });

  const count = async (table: 'properties' | 'units' | 'tenants') => {
    const { count: n, error } = await db.from(table).select('*', { count: 'exact', head: true });
    if (error) throw error;
    return n ?? 0;
  };
  const before = { properties: await count('properties'), units: await count('units'), tenants: await count('tenants') };

  // Properties
  const { data: pRows, error: pErr } = await db
    .from('properties')
    .upsert([...properties.values()], { onConflict: 'name' })
    .select('id, name');
  if (pErr) throw pErr;
  const propertyId = new Map(pRows.map((p) => [p.name.toLowerCase(), p.id as string]));

  // Units
  const { data: uRows, error: uErr } = await db
    .from('units')
    .upsert(
      [...units.values()].map((u) => ({ property_id: propertyId.get(u.propertyKey)!, unit_number: u.unit })),
      { onConflict: 'property_id,unit_number' },
    )
    .select('id, property_id, unit_number');
  if (uErr) throw uErr;
  const idByPropertyUnit = new Map(uRows.map((u) => [`${u.property_id}|${u.unit_number}`, u.id as string]));
  const unitId = (unitKey: string) => {
    const u = units.get(unitKey)!;
    return idByPropertyUnit.get(`${propertyId.get(u.propertyKey)}|${u.unit}`)!;
  };

  // Tenants
  const tenantRows: TenantInput[] = [...tenants.values()].map((t) => ({
    unit_id: unitId(t.unitKey), full_name: t.name, phone: t.phone, email: t.email, is_current: true,
  }));
  if (tenantRows.length) {
    const { error } = await db.from('tenants').upsert(tenantRows, { onConflict: 'unit_id,full_name' });
    if (error) throw error;
  }

  // Anyone on an imported unit who is no longer in the file has moved out.
  const keep = new Set(tenantRows.map((t) => `${t.unit_id}|${t.full_name}`));
  const { data: existing, error: eErr } = await db
    .from('tenants')
    .select('id, unit_id, full_name')
    .in('unit_id', [...idByPropertyUnit.values()])
    .eq('is_current', true);
  if (eErr) throw eErr;
  const stale = existing.filter((t) => !keep.has(`${t.unit_id}|${t.full_name}`)).map((t) => t.id as string);
  if (stale.length) {
    const { error } = await db.from('tenants').update({ is_current: false }).in('id', stale);
    if (error) throw error;
  }

  const after = { properties: await count('properties'), units: await count('units'), tenants: await count('tenants') };
  report(
    `Imported (new: ${after.properties - before.properties} properties, ${after.units - before.units} units, ` +
      `${after.tenants - before.tenants} tenants; ${stale.length} tenant(s) marked as moved out). In file: `,
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
