'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

// No requireStaff(): signing out is always allowed, even for a signed-in user who isn't staff.
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/staff/login');
}
