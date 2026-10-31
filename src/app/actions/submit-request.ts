'use server';

import { randomInt } from 'node:crypto';
import { redirect } from 'next/navigation';
import { CATEGORY_BY_ID, sanitizeAnswers } from '@/config/categories';
import { setConfirmation, type Confirmation } from '@/lib/confirmation';
import { contactMatchesTenant } from '@/lib/contact';
import { MAX_PHOTOS, photoError } from '@/lib/photos';
import { findUnit, insertRequest, savePhotos } from '@/lib/requests';
import { createAdminClient } from '@/lib/supabase/admin';
import { fieldErrors, requestSchema } from '@/lib/validation';

/** Only failures come back; success redirects to /sent. */
export type SubmitResult = { ok: false; message: string };

const text = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
};

/** Same alphabet as gen_request_ref(): no 0/O/1/I/L. Only used for the honeypot's fake success. */
const fakeRef = () =>
  'MR-' + Array.from({ length: 4 }, () => '23456789ABCDEFGHJKMNPQRSTUVWXYZ'[randomInt(31)]).join('');

function parseAnswers(raw: string): Record<string, unknown> {
  try {
    const value: unknown = JSON.parse(raw);
    return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export async function submitRequest(formData: FormData): Promise<SubmitResult> {
  // 1. Validate everything again on the server.
  const parsed = requestSchema.safeParse({
    unitId: text(formData, 'unitId'),
    name: text(formData, 'name'),
    phone: text(formData, 'phone'),
    email: text(formData, 'email'),
    category: text(formData, 'category'),
    answers: parseAnswers(text(formData, 'answers')),
    description: text(formData, 'description'),
    entry: text(formData, 'entry'),
  });
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

  const photos = formData.getAll('photos').filter((f): f is File => f instanceof File && f.size > 0);
  if (photos.length > MAX_PHOTOS) return { ok: false, message: `You can add up to ${MAX_PHOTOS} photos.` };
  const badPhoto = photos.map(photoError).find((e) => e !== null);
  if (badPhoto) return { ok: false, message: badPhoto };

  // 3. The unit must exist.
  const admin = createAdminClient();
  const unit = await findUnit(admin, input.unitId).catch(logFailure);
  if (unit === FAILED) return { ok: false, message: SEND_FAILED };
  if (!unit) return { ok: false, message: "We couldn't find that unit. Reload the page and try again." };

  // 4-6. Flags, then insert.
  const { answers, emergency } = sanitizeAnswers(input.category, input.answers);
  const request = await insertRequest(admin, {
    unit_id: input.unitId,
    contact_name: input.name,
    contact_phone: input.phone || null,
    contact_email: input.email || null,
    contact_matches_tenant: contactMatchesTenant(input, unit.tenants),
    category: input.category,
    answers,
    // The form only reaches this point after "No, still broken", so the check was tried.
    quick_check_tried: category.quickCheck ? true : null,
    emergency_flag: emergency,
    description: input.description,
    entry_allowed: input.entry === 'yes',
  }).catch(logFailure);
  if (request === FAILED) return { ok: false, message: SEND_FAILED };

  // 7. Photos.
  const saved = await savePhotos(admin, request.id, photos);

  // 8. Hand the confirmation page what it needs, then go there.
  const firstAnswer = category.questions.map((q) => answers[q.key]).find(Boolean);
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
