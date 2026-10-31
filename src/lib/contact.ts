/** Matching a request's contact details against the tenants on file for the unit. */

type Tenant = { phone: string | null; email: string | null };

/** Digits only, ignoring a leading US country code, so "(949) 201-4471" equals "1-949-201-4471". */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
}

export function contactMatchesTenant(contact: { phone: string; email: string }, tenants: Tenant[]): boolean {
  const phone = normalizePhone(contact.phone);
  const email = contact.email.trim().toLowerCase();
  return tenants.some(
    (t) =>
      (phone !== '' && normalizePhone(t.phone ?? '') === phone) ||
      (email !== '' && (t.email ?? '').trim().toLowerCase() === email),
  );
}
