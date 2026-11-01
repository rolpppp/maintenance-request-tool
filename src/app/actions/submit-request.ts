'use server';

import 'server-only';

import { randomInt } from 'node:crypto';
import { redirect } from 'next/navigation';
import { CATEGORY_BY_ID } from '@/config/categories';
import type { SubmitResult } from '@/components/request-form/form-state';
import { setConfirmation, type Confirmation } from '@/lib/confirmation';
import { checkPhotos, findUnit, formText as text, insertRequest, newRequestRow, parseRequestForm, savePhotos } from '@/lib/requests';
import { createAdminClient } from '@/lib/supabase/admin';
import { fieldErrors } from '@/lib/validation';

/** Same alphabet as gen_request_ref(): no 0/O/1/I/L. Only used for the honeypot's fake success. */
const fakeRef = () =>
  'MR-' + Array.from({ length: 4 }, () => '23456789ABCDEFGHJKMNPQRSTUVWXYZ'[randomInt(31)]).join('');

export async function submitRequest(formData: FormData): Promise<SubmitResult> {
  // 1. Validate everything again on the server.
  const parsed = parseRequestForm(formData);
  if (!parsed.success) return { ok: false, message: Object.values(fieldErrors(parsed.error))[0] };
  const input = parsed.data;
  const firstName = input.name.split(/\s+/)[0];
  const category = CATEGORY_BY_ID[input.category];
  const entry = input.entry === 'yes' ? 'Staff may enter' : 'Contact me first';

  // 2. Honeypot: bots get a convincing confirmation and nothing is stored.
  if (text(formData, 'website')) {
    await setConfirmation({ ref: fakeRef(), firstName, where: 'Your unit', problem: category.label, entry, photos: 'None' });
    redirect('/sent');
  }

  const checked = checkPhotos(formData);
  if ('error' in checked) return { ok: false, message: checked.error };
  const { photos } = checked;

  // 3. The unit must exist.
  const admin = createAdminClient();
  const unit = await findUnit(admin, input.unitId).catch(logFailure);
  if (unit === FAILED) return { ok: false, message: SEND_FAILED };
  if (!unit) return { ok: false, message: "We couldn't find that unit. Reload the page and try again." };

  // 4-6. Match the tenant on file, flag emergencies, insert. The form only gets this far after
  // "No, still broken", so a quick check was tried.
  const row = newRequestRow(input, unit, category.quickCheck ? true : null);
  const request = await insertRequest(admin, row).catch(logFailure);
  if (request === FAILED) return { ok: false, message: SEND_FAILED };

  // 7. Photos.
  const saved = await savePhotos(admin, request.id, photos);

  // 8. Hand the confirmation page what it needs, then go there.
  const firstAnswer = category.questions.map((q) => row.answers[q.key]).find(Boolean);
  const confirmation: Confirmation = {
    ref: request.ref,
    firstName,
    where: `${unit.propertyName} · Unit ${unit.unitNumber}`,
    problem: firstAnswer ? `${category.label} · ${firstAnswer}` : category.label,
    entry,
    photos: photoSummary(saved, photos.length),
  };
  await setConfirmation(confirmation);
  redirect('/sent');
}

// A thrown DB error would show the tenant a crash page; return a message they can act on instead.
const FAILED = Symbol('failed');
const SEND_FAILED = "Couldn't send your request. Nothing was saved. Try again, or call us if it's urgent.";
function logFailure(error: unknown): typeof FAILED {
  console.error('Request not saved:', error);
  return FAILED;
}

function photoSummary(saved: number, sent: number): string {
  if (sent === 0) return 'None';
  const attached = `${saved} attached`;
  return saved === sent ? attached : `${attached}, ${sent - saved} couldn't be uploaded`;
}
