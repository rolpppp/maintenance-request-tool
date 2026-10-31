'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

export type SignInState = {
  email: string;
  errors: { email?: string; password?: string };
  banner?: string;
};

const credentials = z.object({
  email: z.string().trim().pipe(z.email('Check the email address, it looks incomplete.')),
  password: z.string().min(1, 'Enter your password.').max(200),
});

const WRONG_CREDENTIALS = "That email and password don't match. Try again, or ask the account owner to reset it.";

export async function signIn(_previous: SignInState, formData: FormData): Promise<SignInState> {
  const email = String(formData.get('email') ?? '').trim();
  const parsed = credentials.safeParse({ email, password: formData.get('password') });
  if (!parsed.success) {
    const { fieldErrors } = z.flattenError(parsed.error);
    return { email, errors: { email: fieldErrors.email?.[0], password: fieldErrors.password?.[0] } };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { email, errors: {}, banner: WRONG_CREDENTIALS };

  // A valid account that isn't on the staff list gets the same message, so it reveals nothing.
  const { data: staff } = await supabase.from('staff').select('user_id').eq('user_id', data.user.id).maybeSingle();
  if (!staff) {
    await supabase.auth.signOut();
    return { email, errors: {}, banner: WRONG_CREDENTIALS };
  }

  redirect('/staff');
}
