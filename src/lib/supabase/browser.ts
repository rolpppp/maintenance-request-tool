import { createBrowserClient } from "@supabase/ssr";

// NEXT_PUBLIC_ vars must be referenced literally so Next can inline them into the bundle.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
