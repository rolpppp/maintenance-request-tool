import { z } from 'zod';
import { isValidPhone, PHONE_MESSAGE } from '@/lib/contact';

/** One schema for the vendors form (inline errors) and the server actions, so both say the same thing. */
export const vendorSchema = z.object({
  name: z.string().trim().min(1, "Vendor name can't be empty.").max(80, 'Vendor name can be at most 80 characters.'),
  phone: z
    .string()
    .trim()
    .max(40, PHONE_MESSAGE)
    .refine((phone) => phone === '' || isValidPhone(phone), PHONE_MESSAGE),
});

export type VendorInputErrors = { name?: string; phone?: string };

/** The first message per field, or null when the input is fine. */
export function vendorInputErrors(name: string, phone: string): VendorInputErrors | null {
  const parsed = vendorSchema.safeParse({ name, phone });
  if (parsed.success) return null;
  const errors: VendorInputErrors = {};
  for (const issue of parsed.error.issues) {
    const field = issue.path[0];
    if ((field === 'name' || field === 'phone') && !errors[field]) errors[field] = issue.message;
  }
  return errors;
}
