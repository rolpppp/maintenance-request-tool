import 'server-only';
import { randomUUID } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { sanitizeAnswers } from '@/config/categories';
import { matchTenant } from '@/lib/contact';
import { MAX_PHOTOS, PHOTO_EXTENSIONS, photoError } from '@/lib/photos';
import { requestSchema, type RequestInput } from '@/lib/validation';

/** The tenant form uses the admin client; a staff phone request uses the signed-in user's. */
type Db = SupabaseClient;

export const formText = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
};

function parseAnswers(raw: string): Record<string, unknown> {
  try {
    const value: unknown = JSON.parse(raw);
    return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/** Validates the submitted form on the server, whichever page it came from. */
export function parseRequestForm(formData: FormData) {
  return requestSchema.safeParse({
    unitId: formText(formData, 'unitId'),
    name: formText(formData, 'name'),
    phone: formText(formData, 'phone'),
    email: formText(formData, 'email'),
    category: formText(formData, 'category'),
    answers: parseAnswers(formText(formData, 'answers')),
    description: formText(formData, 'description'),
    entry: formText(formData, 'entry'),
  });
}

/** The attached photos, or the message for the first problem (too many, wrong type, too big). */
export function checkPhotos(formData: FormData): { photos: File[] } | { error: string } {
  const photos = formData.getAll('photos').filter((f): f is File => f instanceof File && f.size > 0);
  if (photos.length > MAX_PHOTOS) return { error: `You can add up to ${MAX_PHOTOS} photos.` };
  const error = photos.map(photoError).find((e) => e !== null);
  return error ? { error } : { photos };
}

type UnitRow = {
  unit_number: string;
  properties: { name: string };
  tenants: { id: string; phone: string | null; email: string | null; is_current: boolean }[];
};

export type UnitOnFile = {
  unitNumber: string;
  propertyName: string;
  tenants: { id: string; phone: string | null; email: string | null }[];
};

/** The unit plus the current tenants' contact details. Tenant data stays on the server. */
export async function findUnit(db: Db, unitId: string): Promise<UnitOnFile | null> {
  const { data, error } = await db
    .from('units')
    .select('unit_number, properties(name), tenants(id, phone, email, is_current)')
    .eq('id', unitId)
    .maybeSingle<UnitRow>();
  if (error) throw error;
  if (!data) return null;

  return {
    unitNumber: data.unit_number,
    propertyName: data.properties.name,
    tenants: data.tenants.filter((t) => t.is_current),
  };
}

type NewRequest = {
  unit_id: string;
  contact_name: string;
  contact_phone: string | null;
  contact_email: string | null;
  /** The current tenant on file whose phone or email matched, else null. */
  tenant_id: string | null;
  category: string;
  answers: Record<string, string>;
  quick_check_tried: boolean | null;
  emergency_flag: boolean;
  description: string;
  entry_allowed: boolean;
  /** Left out for the tenant form (the column defaults to it); staff phone requests set both, as the insert policy requires. */
  source?: 'staff_phone';
  status?: 'new';
};

/** The row for a validated request. `quickCheckTried` is null when nobody was asked. */
export function newRequestRow(input: RequestInput, unit: UnitOnFile, quickCheckTried: boolean | null): NewRequest {
  const { answers, emergency } = sanitizeAnswers(input.category, input.answers);
  return {
    unit_id: input.unitId,
    contact_name: input.name,
    contact_phone: input.phone || null,
    contact_email: input.email || null,
    tenant_id: matchTenant(input, unit.tenants),
    category: input.category,
    answers,
    quick_check_tried: quickCheckTried,
    emergency_flag: emergency,
    description: input.description,
    entry_allowed: input.entry === 'yes',
  };
}

/** Inserts the request. `ref` is random, so on the (rare) unique violation we just try again. */
export async function insertRequest(db: Db, row: NewRequest) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await db.from('requests').insert(row).select('id, ref').single();
    if (!error) return data;
    const refCollision = error.code === '23505' && error.message.includes('ref');
    if (!refCollision) throw error;
  }
  throw new Error('Could not generate a unique reference number');
}

/**
 * Stores each photo at a random path that doesn't reveal the request. Returns how many were saved.
 * A failed photo is logged and skipped instead of throwing: by now the request exists (and its
 * history can't be deleted), so the tenant should get their reference number, not an error.
 */
export async function savePhotos(admin: Db, requestId: string, files: File[]): Promise<number> {
  let saved = 0;
  for (const file of files) {
    const path = `requests/${randomUUID()}/${randomUUID()}.${PHOTO_EXTENSIONS[file.type]}`;
    const upload = await admin.storage.from('request-photos').upload(path, file, { contentType: file.type });
    const row = upload.error
      ? null
      : await admin
          .from('request_photos')
          .insert({ request_id: requestId, storage_path: path, content_type: file.type, size_bytes: file.size });
    const error = upload.error ?? row?.error;
    if (error) console.error('Photo not saved:', error.message);
    else saved++;
  }
  return saved;
}
