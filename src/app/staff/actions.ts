'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { STATUS_META, STATUS_ORDER, type RequestStatus } from '@/config/status';
import type { ActionResult } from '@/lib/action-result';
import { requireStaff } from '@/lib/auth';
import { humanVisit, todayInZone } from '@/lib/format';
import { vendorSchema } from '@/lib/vendor-input';
import { createClient } from '@/lib/supabase/server';

// No requireStaff(): signing out is always allowed, even for a signed-in user who isn't staff.
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/staff/login');
}

/*
 * Every action below calls requireStaff() first, validates with zod, and writes with the signed-in
 * user's own client. Row-level security and the history triggers then record who did it.
 */

const FAILED: ActionResult = { ok: false };

/** A failed write returns `ok: false` and the toast says so; the error itself is only logged. */
function failed(error: unknown): ActionResult {
  console.error('Staff action failed:', error);
  return FAILED;
}

/** Input the staff member can fix: the message reaches the toast, unlike a database error. */
const rejected = (message: string): ActionResult => ({ ok: false, message });

/** Postgres "unique_violation": here, the active-vendor-name index from migration 0003. */
const isDuplicate = (error: { code?: string }) => error.code === '23505';
const duplicateMessage = (name: string) => `There's already a vendor called ${name}.`;

/** Success: refresh every /staff page, since a change on one (a vendor name, a status) shows on others. */
function done(message: string): ActionResult {
  revalidatePath('/staff', 'layout');
  return { ok: true, message };
}

const id = z.uuid();

/** Updates the granted columns of one request. `.single()` fails when RLS or a bad id matched no row. */
async function patchRequest(supabase: SupabaseClient, requestId: string, patch: Record<string, unknown>, message: string) {
  const { error } = await supabase.from('requests').update(patch).eq('id', requestId).select('id').single();
  return error ? failed(error) : done(message);
}

export async function updateStatus(requestId: string, status: string): Promise<ActionResult> {
  const { supabase } = await requireStaff();
  const parsed = z.object({ requestId: id, status: z.enum(STATUS_ORDER) }).safeParse({ requestId, status });
  if (!parsed.success) return FAILED;
  return patchRequest(supabase, parsed.data.requestId, { status: parsed.data.status }, `Status is ${STATUS_META[parsed.data.status].label}`);
}

export async function assignVendor(requestId: string, vendorId: string | null): Promise<ActionResult> {
  const { supabase } = await requireStaff();
  const parsed = z.object({ requestId: id, vendorId: id.nullable() }).safeParse({ requestId, vendorId });
  if (!parsed.success) return FAILED;
  if (parsed.data.vendorId === null) return patchRequest(supabase, parsed.data.requestId, { vendor_id: null }, 'No one is assigned');

  // A removed vendor can't be newly assigned (it stays on requests that already have it).
  const { data: vendor, error } = await supabase
    .from('vendors')
    .select('name')
    .eq('id', parsed.data.vendorId)
    .eq('is_active', true)
    .maybeSingle<{ name: string }>();
  if (error || !vendor) return failed(error ?? 'Vendor not found or removed');
  return patchRequest(supabase, parsed.data.requestId, { vendor_id: parsed.data.vendorId }, `Assigned to ${vendor.name}`);
}

export async function setVisit(requestId: string, visitDate: string | null, visitWindow: string): Promise<ActionResult> {
  const { supabase } = await requireStaff();
  const parsed = z
    .object({ requestId: id, visitDate: z.iso.date().nullable(), visitWindow: z.enum(['any', 'morning', 'afternoon']) })
    .safeParse({ requestId, visitDate, visitWindow });
  if (!parsed.success) return FAILED;
  const { visitDate: date, visitWindow: window } = parsed.data;
  // Dates compare as text ("2026-11-02"); clearing the visit is always allowed.
  if (date && date < todayInZone()) return rejected('Choose today or a later date.');

  // Booking a visit on a brand-new request schedules it. It goes in the same update, so the history
  // records both changes under this staff member. Any other status is left alone.
  let schedules = false;
  if (date) {
    const { data, error } = await supabase.from('requests').select('status').eq('id', parsed.data.requestId).single<{ status: RequestStatus }>();
    if (error) return failed(error);
    schedules = data.status === 'new';
  }

  // A time window with no date means nothing, so clearing the date resets it.
  const visit = date ? `Visit is ${humanVisit(date, window, new Date())}` : 'Visit cleared';
  const message = schedules ? `${visit} · Status is ${STATUS_META.scheduled.label}` : visit;
  const patch = { visit_date: date, visit_window: date ? window : 'any', ...(schedules && { status: 'scheduled' }) };
  return patchRequest(supabase, parsed.data.requestId, patch, message);
}

const noteText = z.string().trim().min(1).max(4000);

// actor_label is required by the table, but the request_events_stamp trigger overwrites it (and
// actor_id) from auth.uid(), so what the client sends here never reaches the history.
async function insertNote(supabase: SupabaseClient, requestId: string, note: string) {
  const { error } = await supabase.from('request_events').insert({ request_id: requestId, kind: 'note', note, actor_label: 'staff' });
  return error;
}

export async function addNote(requestId: string, note: string): Promise<ActionResult> {
  const { supabase } = await requireStaff();
  const parsed = z.object({ requestId: id, note: noteText }).safeParse({ requestId, note });
  if (!parsed.success) return FAILED;
  const error = await insertNote(supabase, parsed.data.requestId, parsed.data.note);
  return error ? failed(error) : done('Note added');
}

/** The Mark as Done dialog: closes the request, then saves "What was done?" as a note when there is one. */
export async function markDone(requestId: string, note: string): Promise<ActionResult> {
  const { supabase } = await requireStaff();
  const parsed = z.object({ requestId: id, note: z.string().trim().max(4000) }).safeParse({ requestId, note });
  if (!parsed.success) return FAILED;

  // Status first: if it fails, nothing changed and no orphan note is left behind.
  const closed = await patchRequest(supabase, parsed.data.requestId, { status: 'done' }, 'Status is Done');
  if (!closed.ok || !parsed.data.note) return closed;
  const error = await insertNote(supabase, parsed.data.requestId, parsed.data.note);
  if (error) {
    console.error('Staff action failed:', error);
    return { ok: true, message: "Status is Done, but the note wasn't saved" };
  }
  return closed;
}

export async function addVendor(name: string, phone: string): Promise<ActionResult> {
  const { supabase } = await requireStaff();
  const parsed = vendorSchema.safeParse({ name, phone });
  if (!parsed.success) return rejected(parsed.error.issues[0].message);
  const { error } = await supabase.from('vendors').insert({ name: parsed.data.name, phone: parsed.data.phone || null });
  if (error && isDuplicate(error)) return rejected(duplicateMessage(parsed.data.name));
  return error ? failed(error) : done(`${parsed.data.name} added`);
}

export async function updateVendor(vendorId: string, name: string, phone: string): Promise<ActionResult> {
  const { supabase } = await requireStaff();
  if (!id.safeParse(vendorId).success) return FAILED;
  const parsed = vendorSchema.safeParse({ name, phone });
  if (!parsed.success) return rejected(parsed.error.issues[0].message);
  const { error } = await supabase
    .from('vendors')
    .update({ name: parsed.data.name, phone: parsed.data.phone || null })
    .eq('id', vendorId)
    .select('id')
    .single();
  if (error && isDuplicate(error)) return rejected(duplicateMessage(parsed.data.name));
  return error ? failed(error) : done(`${parsed.data.name} updated`);
}

/** Removing hides the vendor from the assign list; requests keep it. The in-house vendor is protected by a trigger. */
async function setVendorActive(vendorId: string, isActive: boolean, message: string): Promise<ActionResult> {
  const { supabase } = await requireStaff();
  const parsed = id.safeParse(vendorId);
  if (!parsed.success) return FAILED;
  const { error } = await supabase.from('vendors').update({ is_active: isActive }).eq('id', parsed.data).select('id').single();
  // Undoing a removal fails when a newer vendor has taken the name.
  if (error && isDuplicate(error)) return rejected("There's already an active vendor with that name.");
  return error ? failed(error) : done(message);
}

export async function removeVendor(vendorId: string): Promise<ActionResult> {
  return setVendorActive(vendorId, false, 'Vendor removed');
}

export async function restoreVendor(vendorId: string): Promise<ActionResult> {
  return setVendorActive(vendorId, true, 'Vendor restored');
}
