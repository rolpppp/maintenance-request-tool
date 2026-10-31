import 'server-only';
import { randomUUID } from 'node:crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { PHOTO_EXTENSIONS } from '@/lib/photos';

type Admin = ReturnType<typeof createAdminClient>;

type UnitRow = {
  unit_number: string;
  properties: { name: string };
  tenants: { phone: string | null; email: string | null; is_current: boolean }[];
};

export type UnitOnFile = {
  unitNumber: string;
  propertyName: string;
  tenants: { phone: string | null; email: string | null }[];
};

/** The unit plus the current tenants' contact details. Tenant data stays on the server. */
export async function findUnit(admin: Admin, unitId: string): Promise<UnitOnFile | null> {
  const { data, error } = await admin
    .from('units')
    .select('unit_number, properties(name), tenants(phone, email, is_current)')
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
  contact_matches_tenant: boolean;
  category: string;
  answers: Record<string, string>;
  quick_check_tried: boolean | null;
  emergency_flag: boolean;
  description: string;
  entry_allowed: boolean;
};

/** Inserts the request. `ref` is random, so on the (rare) unique violation we just try again. */
export async function insertRequest(admin: Admin, row: NewRequest) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await admin.from('requests').insert(row).select('id, ref').single();
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
export async function savePhotos(admin: Admin, requestId: string, files: File[]): Promise<number> {
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
