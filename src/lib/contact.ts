/** Matching a request's contact details against the tenants on file for the unit. */

type Tenant = { id: string; phone: string | null; email: string | null };

/** Digits only, ignoring a leading US country code, so "(949) 201-4471" equals "1-949-201-4471". */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
}

export const PHONE_MESSAGE = 'Check the phone number, it should have 10 digits.';

/** A US number as people type it: only digits and ( ) + - . spaces, and 10 digits (11 with a leading 1). */
export function isValidPhone(phone: string): boolean {
  return /^[\d\s()+.-]+$/.test(phone) && normalizePhone(phone).length === 10;
}

/**
 * The id of the current tenant whose phone or email equals the contact's, or null. A hint for
 * staff, not proof of identity. If several match, one matching both wins, else the first.
 */
export function matchTenant(contact: { phone: string; email: string }, tenants: Tenant[]): string | null {
  const phone = normalizePhone(contact.phone);
  const email = contact.email.trim().toLowerCase();
  const phoneMatches = (t: Tenant) => phone !== '' && normalizePhone(t.phone ?? '') === phone;
  const emailMatches = (t: Tenant) => email !== '' && (t.email ?? '').trim().toLowerCase() === email;
  const match = tenants.find((t) => phoneMatches(t) && emailMatches(t)) ?? tenants.find((t) => phoneMatches(t) || emailMatches(t));
  return match?.id ?? null;
}
