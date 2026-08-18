import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { ResetPasswordForm } from "./reset-password-form";

// Only reachable with a real session — /auth/callback establishes one by
// exchanging the code from the reset email before redirecting here. No
// session means this wasn't reached via a valid reset link.
export default async function ResetPasswordPage() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/forgot-password");
  }

  return <ResetPasswordForm />;
}
