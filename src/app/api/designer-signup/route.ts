import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, designerData, mode, email, password, userMetadata } = body;

    if (mode === "dev") {
      if (!email || !password) {
        return NextResponse.json({ error: "Missing email or password" }, { status: 400 });
      }

      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!serviceRoleKey) {
        return NextResponse.json({ error: "Missing SUPABASE_SERVICE_ROLE_KEY" }, { status: 500 });
      }

      const adminSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey,
        { auth: { persistSession: false, autoRefreshToken: false } }
      );

      const { data: createdUser, error: createUserError } = await adminSupabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: userMetadata,
      });

      if (createUserError || !createdUser.user) {
        return NextResponse.json({ error: createUserError?.message || "Failed to create auth user" }, { status: 500 });
      }

      const { error } = await adminSupabase.from("designers").insert({
        ...designerData,
        designer_uuid: createdUser.user.id,
        contact_info: designerData.contact_info,
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    if (!userId) {
      return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
    }

    const supabase = await createSupabaseServer();

    const { error } = await supabase.from("designers").insert({
      ...designerData,
      designer_uuid: userId,
      contact_info: designerData.contact_info,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create designer profile" },
      { status: 500 }
    );
  }
}
