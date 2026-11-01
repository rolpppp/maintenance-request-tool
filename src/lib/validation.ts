import { z } from 'zod';
import { CATEGORIES, CATEGORY_BY_ID, sanitizeAnswers } from '@/config/categories';
import { isValidPhone, PHONE_MESSAGE } from '@/lib/contact';

const CATEGORY_IDS = CATEGORIES.map((c) => c.id);

/**
 * The tenant request, validated identically in the browser (for inline errors) and in the server action.
 * Lengths match the database checks. Photos are checked separately (lib/photos.ts).
 */
export const requestSchema = z
  .object({
    unitId: z.uuid('Choose a unit.'),
    // At least two characters, one of them a letter, so "1" or "." is caught.
    name: z
      .string()
      .trim()
      .min(1, 'Enter your name.')
      .max(120)
      .refine((n) => n.length >= 2 && /\p{L}/u.test(n), 'Check your name.'),
    phone: z
      .string()
      .trim()
      .max(40)
      .refine((p) => p === '' || isValidPhone(p), PHONE_MESSAGE),
    email: z.union([z.literal(''), z.string().trim().max(254).pipe(z.email('Check the email address, it looks incomplete.'))]),
    category: z.enum(CATEGORY_IDS, 'Choose what is wrong.'),
    answers: z.record(z.string(), z.string()),
    description: z.string().trim().min(5, 'Tell us a little about the problem.').max(4000),
    entry: z.enum(['yes', 'no'], 'Choose one so the team knows how to plan the visit.'),
  })
  .superRefine((value, ctx) => {
    if (!value.phone && !value.email) {
      ctx.addIssue({ code: 'custom', path: ['phone'], message: 'Add a phone number or an email.' });
    }
    // An invalid category is reported above; nothing more to check without one.
    if (!(value.category in CATEGORY_BY_ID)) return;
    // Unknown answers are dropped by sanitizeAnswers, so a required question counts as missing.
    const { answers } = sanitizeAnswers(value.category, value.answers);
    const missing = CATEGORY_BY_ID[value.category].questions.some((q) => !q.optional && !answers[q.key]);
    if (missing) ctx.addIssue({ code: 'custom', path: ['answers'], message: 'Answer the questions above.' });
  });

export type RequestInput = z.infer<typeof requestSchema>;

/** First message per top-level field, e.g. { phone: '...', description: '...' }. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0]);
    errors[field] ??= issue.message;
  }
  return errors;
}

/**
 * True when the name is fine and at least one of phone or email is filled in and valid. Decides when the
 * form moves on from "How can we reach you?", using the same field rules as the final check.
 */
export function hasValidContact(contact: { name: string; phone: string; email: string }): boolean {
  const { name, phone, email } = requestSchema.shape;
  const phoneOk = contact.phone.trim() !== '' && phone.safeParse(contact.phone).success;
  const emailOk = contact.email.trim() !== '' && email.safeParse(contact.email).success;
  return name.safeParse(contact.name).success && (phoneOk || emailOk);
}
