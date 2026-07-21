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

// Same pattern as /api/brand-signup and /api/designer-signup: customers
// currently has RLS enabled with zero policies, so a cookie-authenticated
// insert would always fail. Using the service role for both paths, gated by
// an explicit userId+email ownership check, sidesteps that entirely.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, customerData, mode, email, password, userMetadata } = body;

    if (!customerData) {
      return NextResponse.json({ error: "Missing customer data" }, { status: 400 });
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

    const { data: existingCustomer } = await adminSupabase
      .from("customers")
      .select("customer_uuid")
      .eq("customer_uuid", resolvedUserId)
      .maybeSingle();

    if (existingCustomer) {
      return NextResponse.json({ error: "A customer profile already exists for this account" }, { status: 409 });
    }

    const { error: insertError } = await adminSupabase.from("customers").insert({
      ...customerData,
      customer_uuid: resolvedUserId,
    });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create customer profile" },
      { status: 500 }
    );
  }
}
