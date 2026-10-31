import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { requireEnv } from '@/lib/env';

/**
 * What /sent shows. It travels in a short-lived signed cookie so the page never has to
 * look a request up by reference number (tenants can't read requests at all).
 */
const confirmationSchema = z.object({
  ref: z.string(),
  firstName: z.string(),
  where: z.string(),
  problem: z.string(),
  entry: z.string(),
  photos: z.string(),
});
export type Confirmation = z.infer<typeof confirmationSchema>;

const COOKIE = 'request_confirmation';
const MAX_AGE_SECONDS = 600;

const sign = (payload: string) =>
  createHmac('sha256', requireEnv('CONFIRMATION_COOKIE_SECRET')).update(payload).digest('base64url');

export async function setConfirmation(confirmation: Confirmation) {
  // exp is checked on read too: the cookie's maxAge is only a browser hint.
  const body = { ...confirmation, exp: Date.now() + MAX_AGE_SECONDS * 1000 };
  const payload = Buffer.from(JSON.stringify(body)).toString('base64url');
  (await cookies()).set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/sent',
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function readConfirmation(): Promise<Confirmation | null> {
  const value = (await cookies()).get(COOKIE)?.value;
  const [payload, signature] = value?.split('.') ?? [];
  if (!payload || !signature) return null;

  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(signature);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;

  try {
    const body = confirmationSchema.extend({ exp: z.number() }).parse(JSON.parse(Buffer.from(payload, 'base64url').toString()));
    return body.exp > Date.now() ? body : null;
  } catch {
    return null;
  }
}
