'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { STATUS_META, STATUS_ORDER } from '@/config/status';
import type { ActionResult } from '@/lib/action-result';
import { requireStaff } from '@/lib/auth';
import { humanVisit } from '@/lib/format';
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

  // A time window with no date means nothing, so clearing the date resets it.
  const message = date ? `Visit is ${humanVisit(date, window, new Date())}` : 'Visit cleared';
  return patchRequest(supabase, parsed.data.requestId, { visit_date: date, visit_window: date ? window : 'any' }, message);
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

const vendorSchema = z.object({
  name: z.string().trim().min(1).max(80),
  phone: z.string().trim().max(40),
});

export async function addVendor(name: string, phone: string): Promise<ActionResult> {
  const { supabase } = await requireStaff();
  const parsed = vendorSchema.safeParse({ name, phone });
  if (!parsed.success) return FAILED;
  const { error } = await supabase.from('vendors').insert({ name: parsed.data.name, phone: parsed.data.phone || null });
  return error ? failed(error) : done(`${parsed.data.name} added`);
}

export async function updateVendor(vendorId: string, name: string, phone: string): Promise<ActionResult> {
  const { supabase } = await requireStaff();
  const parsed = z.object({ vendorId: id }).extend(vendorSchema.shape).safeParse({ vendorId, name, phone });
  if (!parsed.success) return FAILED;
  const { error } = await supabase
    .from('vendors')
    .update({ name: parsed.data.name, phone: parsed.data.phone || null })
    .eq('id', parsed.data.vendorId)
    .select('id')
    .single();
  return error ? failed(error) : done(`${parsed.data.name} updated`);
}

/** Removing hides the vendor from the assign list; requests keep it. The in-house vendor is protected by a trigger. */
async function setVendorActive(vendorId: string, isActive: boolean, message: string): Promise<ActionResult> {
  const { supabase } = await requireStaff();
  const parsed = id.safeParse(vendorId);
  if (!parsed.success) return FAILED;
  const { error } = await supabase.from('vendors').update({ is_active: isActive }).eq('id', parsed.data).select('id').single();
  return error ? failed(error) : done(message);
}

export async function removeVendor(vendorId: string): Promise<ActionResult> {
  return setVendorActive(vendorId, false, 'Vendor removed');
}

export async function restoreVendor(vendorId: string): Promise<ActionResult> {
  return setVendorActive(vendorId, true, 'Vendor restored');
}
