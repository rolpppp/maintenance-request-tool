import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Call first in every staff page and server action.
 * getUser() asks Supabase Auth to verify the token; getSession() would trust the cookie.
 */
export async function requireStaff() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/staff/login");

  // RLS lets staff read the staff table, so a signed-in non-staff user gets no row.
  const { data: staff } = await supabase
    .from("staff")
    .select("user_id, display_name")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!staff) redirect("/staff/login");

  return { supabase, user, staff: { id: staff.user_id as string, displayName: staff.display_name as string } };
}
