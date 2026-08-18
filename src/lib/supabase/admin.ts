import { createClient } from "@supabase/supabase-js";

// Service-role client: bypasses RLS entirely. Only use for writes that a
// cookie-authenticated user client can't perform (e.g. during the signup
// window before a session exists, or webhook/server-only order writes).
export function getAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
