'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { SubmitResult } from '@/components/request-form/form-state';
import { requireStaff } from '@/lib/auth';
import { checkPhotos, findUnit, insertRequest, newRequestRow, parseRequestForm, savePhotos } from '@/lib/requests';
import { createAdminClient } from '@/lib/supabase/admin';
import { fieldErrors } from '@/lib/validation';

/** A staff member logs a request that came in by phone. Only failures come back; success opens the request. */
export async function logPhoneRequest(formData: FormData): Promise<SubmitResult> {
  const { supabase } = await requireStaff();

  const parsed = parseRequestForm(formData);
  if (!parsed.success) return { ok: false, message: Object.values(fieldErrors(parsed.error))[0] };
  const checked = checkPhotos(formData);
  if ('error' in checked) return { ok: false, message: checked.error };

  let ref: string;
  try {
    // The user's own client does the reads and the insert, so RLS applies and the history
    // records this person as the creator. The caller is not asked the quick check, hence null.
    const unit = await findUnit(supabase, parsed.data.unitId);
    if (!unit) return { ok: false, message: "Couldn't find that unit. Reload the page and try again." };
    const request = await insertRequest(supabase, { ...newRequestRow(parsed.data, unit, null), source: 'staff_phone', status: 'new' });
    // The storage bucket has no policies, so uploads need the admin client. Safe here: requireStaff() passed.
    await savePhotos(createAdminClient(), request.id, checked.photos);
    ref = request.ref;
  } catch (error) {
    console.error('Phone request not saved:', error);
    return { ok: false, message: "Couldn't save the request. Nothing was saved. Try again." };
  }

  revalidatePath('/staff', 'layout');
  redirect(`/staff/requests/${ref}`);
}
