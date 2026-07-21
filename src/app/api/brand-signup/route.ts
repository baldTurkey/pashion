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

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const mode = formData.get("mode")?.toString();
    const brandDataRaw = formData.get("brandData")?.toString();
    const contactInfoRaw = formData.get("contactInfo")?.toString();
    const logoFile = formData.get("logo");

    if (!brandDataRaw || !contactInfoRaw) {
      return NextResponse.json({ error: "Missing brand data" }, { status: 400 });
    }

    const brandData = JSON.parse(brandDataRaw);
    const contactInfo = JSON.parse(contactInfoRaw);
    const adminSupabase = getAdminClient();

    let userId: string;

    if (mode === "dev") {
      const email = formData.get("email")?.toString();
      const password = formData.get("password")?.toString();
      const userMetadataRaw = formData.get("userMetadata")?.toString();

      if (!email || !password) {
        return NextResponse.json({ error: "Missing email or password" }, { status: 400 });
      }

      const { data: createdUser, error: createUserError } = await adminSupabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: userMetadataRaw ? JSON.parse(userMetadataRaw) : undefined,
      });

      if (createUserError || !createdUser.user) {
        return NextResponse.json({ error: createUserError?.message || "Failed to create auth user" }, { status: 500 });
      }

      userId = createdUser.user.id;
    } else {
      const providedUserId = formData.get("userId")?.toString();
      const email = formData.get("email")?.toString();

      if (!providedUserId || !email) {
        return NextResponse.json({ error: "Missing user ID or email" }, { status: 400 });
      }

      // No session exists yet if email confirmation is required, so we can't rely on
      // a cookie to prove who's calling. Instead, confirm the userId really belongs to
      // the email that was just used at signUp() time as a lightweight ownership check.
      const { data: userLookup, error: userLookupError } = await adminSupabase.auth.admin.getUserById(
        providedUserId
      );

      if (userLookupError || !userLookup.user || userLookup.user.email !== email) {
        return NextResponse.json({ error: "Could not verify account ownership" }, { status: 403 });
      }

      userId = providedUserId;
    }

    // Never overwrite an existing brand profile for this account.
    const { data: existingBrand } = await adminSupabase
      .from("brands")
      .select("account_id")
      .eq("account_id", userId)
      .maybeSingle();

    if (existingBrand) {
      return NextResponse.json({ error: "A brand profile already exists for this account" }, { status: 409 });
    }

    let logoUrl: string | null = null;

    if (logoFile instanceof File && logoFile.size > 0) {
      const extension = logoFile.name.split(".").pop() || "png";
      const path = `${userId}/logo.${extension}`;

      const { error: uploadError } = await adminSupabase.storage
        .from("brand-logos")
        .upload(path, logoFile, { upsert: true, contentType: logoFile.type });

      if (uploadError) {
        return NextResponse.json({ error: uploadError.message }, { status: 500 });
      }

      const { data: publicUrlData } = adminSupabase.storage.from("brand-logos").getPublicUrl(path);
      logoUrl = publicUrlData.publicUrl;
    }

    const { error: insertError } = await adminSupabase.from("brands").insert({
      ...brandData,
      account_id: userId,
      contact_info: contactInfo,
      logo: logoUrl,
    });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create brand profile" },
      { status: 500 }
    );
  }
}
