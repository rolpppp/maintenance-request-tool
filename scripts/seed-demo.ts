/**
 * Load 7 realistic demo requests so the dashboard shows every group. Run once, after the sample
 * CSV is imported and a staff user exists.
 *
 *   npm run seed:demo -- demo@example.com "password" [--dry-run]
 *   (package.json: "seed:demo": "tsx --env-file=.env.local scripts/seed-demo.ts")
 *
 * How it works:
 *  1. The requests are inserted with the ADMIN client as source = 'tenant_form', so they look like
 *     tenant submissions. tenant_id and emergency_flag come from the app's own helpers (matchTenant,
 *     sanitizeAnswers) and every request passes the app's own requestSchema first.
 *  2. created_at is backdated here, so ages on the dashboard are right.
 *  3. The script then signs in as the given staff user with the ANON key (the user's own client, like
 *     the staff pages) and assigns, schedules, closes and adds notes, so the history records that person.
 *
 * Limits: request_events is append-only and stamped with now() by a trigger, so history times can't be
 * backdated. Status changes therefore show as "today" in Activity and "Waiting since today" in the table,
 * while the requests' own "Open for" ages are right. The one exception is the Done request's closed_at,
 * which the script sets so it reads "Fixed" a day ago.
 *
 * Safe to run twice? No: it refuses to run if any demo contact already has a request. --dry-run only reads.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { CATEGORY_BY_ID, sanitizeAnswers, type CategoryId } from '@/config/categories';
import { matchTenant } from '@/lib/contact';
import { requestSchema } from '@/lib/validation';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

type Window = 'any' | 'morning' | 'afternoon';
type Demo = {
  /** What the dashboard should show for it. */
  target: string;
  property: string;
  unit: string;
  name: string;
  phone: string;
  email: string;
  category: CategoryId;
  answers: Record<string, string>;
  description: string;
  entry: 'yes' | 'no';
  ageMs: number;
  /** Applied afterwards as the staff user, in this order. */
  vendor?: string;
  visit?: { daysAhead: number; window: Window };
  status?: 'scheduled' | 'waiting_on_vendor' | 'done';
  note?: string;
  /** Done only: how long ago it was closed. */
  closedAgoMs?: number;
};

// Phones and emails are the CSV's own where the tenant is "on file". The two that don't match:
// a roommate (Bayview B) and a mistyped phone plus the email the CSV has misspelled (Bayview A).
const DEMOS: Demo[] = [
  {
    target: 'New, 25 min old',
    property: 'Palm Court', unit: '101',
    name: 'Maria Santos', phone: '(949) 201-4471', email: 'maria.santos84@gmail.com',
    category: 'plumbing',
    answers: { problem: 'Leak or drip', water_spreading: 'No' },
    description: 'The pipe under the kitchen sink drips steadily. I put a bowl under it and it fills up about every two hours. It started yesterday evening.',
    entry: 'yes',
    ageMs: 25 * MINUTE,
  },
  {
    target: 'New, 2 hours old, emergency (no AC over 90°F)',
    property: 'Cedar Row', unit: '3',
    name: 'Robert Kim', phone: '(949) 410-7781', email: 'robert.kim@gmail.com',
    category: 'ac_heating',
    answers: { symptom: 'Blowing warm air', over_90f: 'Yes', filter_changed: 'Over 3 months' },
    description: 'The AC has been blowing warm air since early this morning and the thermostat reads 91 inside. I checked the breaker and it looks fine. I have a baby at home, so this is getting urgent.',
    entry: 'no',
    ageMs: 2 * HOUR,
  },
  {
    target: 'New, aging (4 days), Not on file (roommate)',
    property: 'Bayview Flats', unit: 'B',
    name: 'Tyler Brooks', phone: '949-304-8841', email: '',
    category: 'pest',
    answers: { pest_type: 'Roaches', where: 'Kitchen' },
    description: 'Seeing roaches in the kitchen most nights, mostly behind the stove and under the sink. Store-bought traps made no difference. I live here with Angela, who is on the lease.',
    entry: 'yes',
    ageMs: 4 * DAY,
  },
  {
    target: 'Scheduled, visit tomorrow afternoon',
    property: 'Palm Court', unit: '104',
    name: 'Denise Carter', phone: '949-201-1190', email: '',
    category: 'electrical',
    answers: { affected: 'One outlet or switch' },
    description: 'The outlet beside the bathroom mirror stopped working. I pressed reset on it and flipped the breaker off and on, but it is still dead.',
    entry: 'yes',
    ageMs: 1 * DAY,
    vendor: 'Electrician',
    visit: { daysAhead: 1, window: 'afternoon' },
    status: 'scheduled',
  },
  {
    target: 'Waiting on vendor, 2 days old, Not on file (mistyped phone)',
    property: 'Bayview Flats', unit: 'A',
    name: 'Luis Herrera', phone: '(949) 304-7718', email: 'luis.herrera@gmail.com',
    category: 'appliance',
    answers: { appliance: 'Dishwasher' },
    description: 'The dishwasher stopped draining. There is standing water at the bottom after every cycle and a sour smell. It is plugged in and the breaker is fine.',
    entry: 'yes',
    ageMs: 2 * DAY,
    vendor: 'Plumber',
    status: 'waiting_on_vendor',
  },
  {
    target: 'Waiting on vendor, aging (5 days)',
    property: 'Bayview Flats', unit: 'D',
    name: 'Priya Patel', phone: '949-304-0098', email: 'priya.patel@yahoo.com',
    category: 'ac_heating',
    answers: { symptom: 'Making a noise', over_90f: 'No', filter_changed: '1–3 months ago' },
    description: 'A loud rattling starts whenever the AC kicks on, and the air is much weaker than it used to be. The bedroom stays warm even with the fan on high.',
    entry: 'no',
    ageMs: 5 * DAY,
    vendor: 'AC contractor',
    status: 'waiting_on_vendor',
    note: 'Contractor says the fan motor needs replacing. Part ordered, no delivery date yet. Following up Monday.',
  },
  {
    target: 'Done, 3 days old, closed yesterday',
    property: 'Palm Court', unit: '105',
    name: 'Rachel Nguyen', phone: '949-201-3346', email: 'rachelnguyen.rn@gmail.com',
    category: 'door_lock',
    answers: { problem: 'Key broken or stuck' },
    description: 'The key snapped off inside the front door lock. I can still get in through the back, but the front door will not lock now.',
    entry: 'yes',
    ageMs: 3 * DAY,
    vendor: 'In-house maintenance',
    status: 'done',
    note: 'Replaced the lock cylinder and cut two new keys. Left both with the tenant.',
    closedAgoMs: 1 * DAY,
  },
];

const Args = z.tuple([z.email('First argument must be the staff email.'), z.string().min(1, 'Second argument must be the password.')]);

const requiredEnv = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`Set ${name} (see .env.example)`);
  return value;
};

type UnitRow = {
  id: string;
  unit_number: string;
  properties: { name: string };
  tenants: { id: string; phone: string | null; email: string | null; is_current: boolean }[];
};

async function findUnit(admin: SupabaseClient, property: string, unit: string): Promise<UnitRow> {
  const { data, error } = await admin
    .from('units')
    .select('id, unit_number, properties!inner(name), tenants(id, phone, email, is_current)')
    .eq('properties.name', property)
    .eq('unit_number', unit)
    .maybeSingle<UnitRow>();
  if (error) throw error;
  if (!data) throw new Error(`Unit ${property} ${unit} not found. Run npm run import:units first.`);
  return data;
}

/** "2026-11-02": the calendar date `daysAhead` days from now in the company time zone. */
const dateAhead = (daysAhead: number) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: process.env.APP_TIME_ZONE ?? 'America/New_York' }).format(new Date(Date.now() + daysAhead * DAY));

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const parsedArgs = Args.safeParse(args.filter((a) => !a.startsWith('--')));
  if (!parsedArgs.success) throw new Error(`${parsedArgs.error.issues[0].message}\nUsage: npm run seed:demo -- email "password" [--dry-run]`);
  const [email, password] = parsedArgs.data;

  const url = requiredEnv('NEXT_PUBLIC_SUPABASE_URL');
  const opts = { auth: { persistSession: false, autoRefreshToken: false } };
  const admin = createClient(url, requiredEnv('SUPABASE_SERVICE_ROLE_KEY'), opts);

  // Guard: never insert the set twice.
  const { data: existing, error: guardError } = await admin
    .from('requests')
    .select('ref, contact_name')
    .in('contact_name', DEMOS.map((d) => d.name));
  if (guardError) throw guardError;
  if (existing.length) {
    const list = existing.map((r) => `${r.ref} (${r.contact_name})`).join(', ');
    throw new Error(`Refusing to run: requests from the demo contacts already exist: ${list}`);
  }

  // Check every demo before writing anything.
  const planned = [];
  for (const demo of DEMOS) {
    const unit = await findUnit(admin, demo.property, demo.unit);
    const input = requestSchema.parse({
      unitId: unit.id, name: demo.name, phone: demo.phone, email: demo.email,
      category: demo.category, answers: demo.answers, description: demo.description, entry: demo.entry,
    });
    const { answers, emergency } = sanitizeAnswers(input.category, input.answers);
    const tenantId = matchTenant(input, unit.tenants.filter((t) => t.is_current));
    planned.push({ demo, input, answers, emergency, tenantId, unitId: unit.id });
  }

  console.log(dryRun ? 'Dry run: nothing will be written.\n' : 'Will create:\n');
  for (const p of planned) {
    const flags = [p.tenantId ? 'on file' : 'NOT on file', p.emergency ? 'emergency' : null].filter(Boolean).join(', ');
    console.log(`  ${p.demo.property} ${p.demo.unit} · ${p.demo.name} · ${p.demo.category} · ${p.demo.target} (${flags})`);
  }
  if (dryRun) return;

  const created: { ref: string; id: string; demo: Demo }[] = [];
  for (const p of planned) {
    const { data, error } = await admin
      .from('requests')
      .insert({
        unit_id: p.unitId,
        contact_name: p.input.name,
        contact_phone: p.input.phone || null,
        contact_email: p.input.email || null,
        tenant_id: p.tenantId,
        category: p.input.category,
        answers: p.answers,
        // The tenant form asks for the quick check only in categories that have one.
        quick_check_tried: CATEGORY_BY_ID[p.input.category].quickCheck ? true : null,
        emergency_flag: p.emergency,
        description: p.input.description,
        entry_allowed: p.input.entry === 'yes',
        created_at: new Date(Date.now() - p.demo.ageMs).toISOString(),
      })
      .select('id, ref')
      .single();
    if (error) throw new Error(`Stopped after ${created.length} of ${planned.length} (${error.message}). Delete the partial demo data before re-running.`);
    created.push({ ref: data.ref, id: data.id, demo: p.demo });
  }

  // From here on everything is done as the staff user, like the staff pages do.
  const staff = createClient(url, requiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'), opts);
  const { error: signInError } = await staff.auth.signInWithPassword({ email, password });
  if (signInError) throw new Error(`Requests were created, but signing in as ${email} failed: ${signInError.message}`);
  const { data: vendors, error: vendorError } = await staff.from('vendors').select('id, name').returns<{ id: string; name: string }[]>();
  if (vendorError) throw vendorError;

  const change = async (id: string, patch: Record<string, unknown>) => {
    const { error } = await staff.from('requests').update(patch).eq('id', id).select('id').single();
    if (error) throw error;
  };

  for (const { id, demo } of created) {
    if (demo.vendor) {
      const vendor = vendors.find((v) => v.name === demo.vendor);
      if (!vendor) throw new Error(`Vendor "${demo.vendor}" not found. Run supabase/seed.sql.`);
      await change(id, { vendor_id: vendor.id });
    }
    if (demo.visit) await change(id, { visit_date: dateAhead(demo.visit.daysAhead), visit_window: demo.visit.window });
    if (demo.status) await change(id, { status: demo.status });
    if (demo.note) {
      const { error } = await staff.from('request_events').insert({ request_id: id, kind: 'note', note: demo.note, actor_label: 'staff' });
      if (error) throw error;
    }
    // closed_at is set to now() by a trigger; move it back so "Fixed" reads right. No history row is involved.
    if (demo.closedAgoMs) {
      const { error } = await admin.from('requests').update({ closed_at: new Date(Date.now() - demo.closedAgoMs).toISOString() }).eq('id', id);
      if (error) throw error;
    }
  }
  await staff.auth.signOut();

  console.log('\nCreated:');
  for (const { ref, demo } of created) console.log(`  ${ref}  ${demo.property} ${demo.unit}  ${demo.target}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
