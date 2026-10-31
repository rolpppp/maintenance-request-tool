/**
 * Create a staff account, or reset an existing one's password. There is no public sign-up.
 *
 *   npm run create:staff -- demo@example.com "Maria R." "a-strong-password"
 *
 * Use double quotes: on Windows npm runs scripts through cmd.exe, which keeps single quotes
 * as part of the password.
 *   (package.json: "create:staff": "tsx --env-file=.env.local scripts/create-staff.ts")
 */
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const Args = z.tuple([
  z.string().email('First argument must be a valid email.'),
  z.string().trim().min(1).max(80, 'Display name must be 1-80 characters.'),
  z.string().min(8, 'Password must be at least 8 characters.'),
]);

async function main() {
  const parsed = Args.safeParse(process.argv.slice(2));
  if (!parsed.success) {
    throw new Error(`${parsed.error.issues[0].message}\nUsage: npm run create:staff -- email "Display Name" "password"`);
  }
  const [email, displayName, password] = parsed.data;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  const db = createClient(url, key, { auth: { persistSession: false } });

  const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true });
  if (error && !/already/i.test(error.message)) throw error;

  let userId = data?.user?.id;
  if (!userId) {
    // User exists already: this is how the account owner resets a password, so set the new one.
    const { data: list, error: listErr } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (listErr) throw listErr;
    userId = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())?.id;
    if (!userId) throw new Error(`Could not find user ${email}`);
    const { error: resetErr } = await db.auth.admin.updateUserById(userId, { password });
    if (resetErr) throw resetErr;
  }

  const { error: staffErr } = await db
    .from('staff')
    .upsert({ user_id: userId, display_name: displayName }, { onConflict: 'user_id' });
  if (staffErr) throw staffErr;

  // Shells can rewrite passwords (cmd.exe expands % and ^), so prove the stored one works as typed.
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (anonKey) {
    const anon = createClient(url, anonKey, { auth: { persistSession: false } });
    const { error: signInErr } = await anon.auth.signInWithPassword({ email, password });
    if (signInErr) throw new Error(`Account saved, but signing in with it failed: ${signInErr.message}`);
  }

  console.log(`Staff account ready: ${email} (${displayName}), password is ${password.length} characters`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
