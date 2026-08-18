import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

//This is where the email confirmation
// link actually lands after Supabase's own server verifies it.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/brand/dashboard";

  if (code) {
    const supabase = await createSupabaseServer();
    // Exchanges the one-time code from the email link for a real session,and writes it into cookies on this response 
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/sign-up/brand?error=confirmation-failed`);
}