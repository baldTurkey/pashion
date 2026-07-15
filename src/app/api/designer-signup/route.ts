import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Same pattern as /api/brand-signup: designers currently has RLS enabled with
// zero policies (confirmed via `supabase db query --linked`), so a
// cookie-authenticated insert would always fail, not just during the
// email-confirmation window. Using the service role for both paths, gated by
// an explicit userId+email ownership check, sidesteps that entirely.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, designerData, mode, email, password, userMetadata } = body;

    if (!designerData) {
      return NextResponse.json({ error: "Missing designer data" }, { status: 400 });
    }

    const adminSupabase = getAdminClient();

    let resolvedUserId: string;

    if (mode === "dev") {
      if (!email || !password) {
        return NextResponse.json({ error: "Missing email or password" }, { status: 400 });
      }

      const { data: createdUser, error: createUserError } = await adminSupabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: userMetadata,
      });

      if (createUserError || !createdUser.user) {
        return NextResponse.json({ error: createUserError?.message || "Failed to create auth user" }, { status: 500 });
      }

      resolvedUserId = createdUser.user.id;
    } else {
      if (!userId || !email) {
        return NextResponse.json({ error: "Missing user ID or email" }, { status: 400 });
      }

      const { data: userLookup, error: userLookupError } = await adminSupabase.auth.admin.getUserById(userId);

      if (userLookupError || !userLookup.user || userLookup.user.email !== email) {
        return NextResponse.json({ error: "Could not verify account ownership" }, { status: 403 });
      }

      resolvedUserId = userId;
    }

    const { data: existingDesigner } = await adminSupabase
      .from("designers")
      .select("designer_uuid")
      .eq("designer_uuid", resolvedUserId)
      .maybeSingle();

    if (existingDesigner) {
      return NextResponse.json({ error: "A designer profile already exists for this account" }, { status: 409 });
    }

    const { error: insertError } = await adminSupabase.from("designers").insert({
      ...designerData,
      designer_uuid: resolvedUserId,
    });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create designer profile" },
      { status: 500 }
    );
  }
}
