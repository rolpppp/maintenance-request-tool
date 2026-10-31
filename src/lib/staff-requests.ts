import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { DAY } from '@/lib/format';
import { DONE_VISIBLE_DAYS, type DashboardRequest } from '@/lib/dashboard';
import type { RequestRow } from '@/lib/request-types';
import { createAdminClient } from '@/lib/supabase/admin';

/** Reads for the staff screens. They take the signed-in user's client, so RLS decides what is visible. */

const BASE_COLUMNS =
  'id, ref, contact_name, tenant_id, tenant:tenants!requests_tenant_id_fkey(full_name), category, answers, description, status, vendor_id, visit_date, visit_window, created_at, closed_at, vendors(name, phone, is_in_house)';

/** Open requests plus the ones closed in the last week. Older closed requests are not needed here. */
export async function listRequests(supabase: SupabaseClient, now: Date): Promise<DashboardRequest[]> {
  const since = new Date(now.getTime() - DONE_VISIBLE_DAYS * DAY).toISOString();
  const { data, error } = await supabase
    .from('requests')
    .select(`${BASE_COLUMNS}, units(unit_number, properties(name)), request_events(kind, to_value, created_at)`)
    .or(`status.neq.done,closed_at.gte.${since}`)
    .returns<DashboardRequest[]>();
  if (error) throw error;
  return data;
}

export type RequestDetail = RequestRow & {
  contact_phone: string | null;
  contact_email: string | null;
  quick_check_tried: boolean | null;
  emergency_flag: boolean;
  entry_allowed: boolean;
  source: 'tenant_form' | 'staff_phone';
  units: RequestRow['units'] & { tenants: { full_name: string; phone: string | null; is_current: boolean }[] };
};

export type RequestEvent = {
  id: number;
  actor_label: string;
  kind: 'created' | 'status' | 'assignment' | 'visit' | 'note';
  from_value: string | null;
  to_value: string | null;
  note: string | null;
  created_at: string;
};

export type RequestPhoto = { id: string; url: string };

export async function getRequest(supabase: SupabaseClient, ref: string): Promise<RequestDetail | null> {
  const { data, error } = await supabase
    .from('requests')
    .select(
      `${BASE_COLUMNS}, units(unit_number, properties(name), tenants(full_name, phone, is_current)), contact_phone, contact_email, quick_check_tried, emergency_flag, entry_allowed, source`,
    )
    .eq('ref', ref)
    .maybeSingle<RequestDetail>();
  if (error) throw error;
  return data;
}

export async function listEvents(supabase: SupabaseClient, requestId: string): Promise<RequestEvent[]> {
  const { data, error } = await supabase
    .from('request_events')
    .select('id, actor_label, kind, from_value, to_value, note, created_at')
    .eq('request_id', requestId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .returns<RequestEvent[]>();
  if (error) throw error;
  return data;
}

/**
 * Photo links expire after 300 seconds. The storage bucket has no policies (staff can't read it
 * directly), so the links come from the admin client. Only call this after requireStaff().
 */
export async function listPhotos(supabase: SupabaseClient, requestId: string): Promise<RequestPhoto[]> {
  const { data, error } = await supabase
    .from('request_photos')
    .select('id, storage_path')
    .eq('request_id', requestId)
    .order('created_at')
    .returns<{ id: string; storage_path: string }[]>();
  if (error) throw error;
  if (data.length === 0) return [];

  const signed = await createAdminClient()
    .storage.from('request-photos')
    .createSignedUrls(data.map((p) => p.storage_path), 300);
  if (signed.error) throw signed.error;
  return data.flatMap((photo, i) => {
    const url = signed.data[i]?.signedUrl;
    return url ? [{ id: photo.id, url }] : [];
  });
}

export async function listPropertyNames(supabase: SupabaseClient): Promise<string[]> {
  const { data, error } = await supabase.from('properties').select('name').order('name').returns<{ name: string }[]>();
  if (error) throw error;
  return data.map((p) => p.name);
}

export type Vendor = { id: string; name: string; phone: string | null; is_in_house: boolean; is_active: boolean };

/** Every vendor, removed ones included: a request may still be assigned to one. Callers filter. */
export async function listVendors(supabase: SupabaseClient): Promise<Vendor[]> {
  const { data, error } = await supabase
    .from('vendors')
    .select('id, name, phone, is_in_house, is_active')
    .order('sort_order')
    .order('name')
    .returns<Vendor[]>();
  if (error) throw error;
  return data;
}

/** Open (not Done) requests per vendor id. */
export async function openRequestCounts(supabase: SupabaseClient): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('requests')
    .select('vendor_id')
    .not('vendor_id', 'is', null)
    .neq('status', 'done')
    .returns<{ vendor_id: string }[]>();
  if (error) throw error;
  const counts: Record<string, number> = {};
  for (const { vendor_id } of data) counts[vendor_id] = (counts[vendor_id] ?? 0) + 1;
  return counts;
}
