import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

function parseJsonObject(value: unknown): Record<string, unknown> | null {
  if (!value) return null;
  if (typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value !== "string") return null;

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";

    let userId: string | null = null;
    let mode: string | null = null;
    let email: string | null = null;
    let password: string | null = null;
    let brandData: Record<string, unknown> | null = null;
    let contactInfo: Record<string, unknown> | null = null;
    let userMetadata: Record<string, unknown> | null = null;

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();

      userId = form.get("userId")?.toString() ?? null;
      mode = form.get("mode")?.toString() ?? null;
      email = form.get("email")?.toString() ?? null;
      password = form.get("password")?.toString() ?? null;
      brandData = parseJsonObject(form.get("brandData")?.toString() ?? null);
      contactInfo = parseJsonObject(form.get("contactInfo")?.toString() ?? null);
      userMetadata = parseJsonObject(form.get("userMetadata")?.toString() ?? null);
    } else {
      const body = await request.json();

      userId = typeof body.userId === "string" ? body.userId : null;
      mode = typeof body.mode === "string" ? body.mode : null;
      email = typeof body.email === "string" ? body.email : null;
      password = typeof body.password === "string" ? body.password : null;
      brandData = parseJsonObject(body.brandData);
      contactInfo = parseJsonObject(body.contactInfo) ?? parseJsonObject(body.brandData?.contact_info);
      userMetadata = parseJsonObject(body.userMetadata);
    }

    if (!brandData) {
      return NextResponse.json({ error: "Missing or invalid brandData" }, { status: 400 });
    }

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
        user_metadata: userMetadata ?? undefined,
      });

      if (createUserError || !createdUser.user) {
        return NextResponse.json({ error: createUserError?.message || "Failed to create auth user" }, { status: 500 });
      }

      const { error } = await adminSupabase.from("brands").insert({
        ...brandData,
        account_id: createdUser.user.id,
        contact_info: contactInfo ? JSON.stringify(contactInfo) : null,
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

    const { error } = await supabase.from("brands").insert({
      ...brandData,
      account_id: userId,
      contact_info: contactInfo ? JSON.stringify(contactInfo) : null,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create brand profile" },
      { status: 500 }
    );
  }
}
