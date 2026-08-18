import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getBrandByAccountId } from "@/lib/brands/queries";
import { getStripe } from "@/lib/stripe/server";

// Creates (if needed) the brand's Stripe Express account and returns a
// one-time onboarding link URL for the browser to redirect to. Re-running
// this after a brand already has an account just issues a fresh link, so
// it also works as a "resume onboarding" button.
export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }

    const brand = await getBrandByAccountId(supabase, user.id);

    if (!brand) {
      return NextResponse.json({ error: "No brand profile for this account" }, { status: 404 });
    }

    let stripeAccountId = brand.stripe_account_id;

    if (!stripeAccountId) {
      const account = await getStripe().accounts.create({
        type: "express",
        email: user.email,
        business_type: "individual",
        business_profile: { name: brand.company_name },
      });

      stripeAccountId = account.id;

      // RLS allows this: brands_update_own lets a brand update its own row.
      const { error: updateError } = await supabase
        .from("brands")
        .update({ stripe_account_id: stripeAccountId })
        .eq("account_id", user.id);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
    }

    const origin = new URL(request.url).origin;
    const accountLink = await getStripe().accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${origin}/brand/dashboard?stripe=refresh`,
      return_url: `${origin}/brand/dashboard?stripe=return`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to start Stripe onboarding" },
      { status: 500 }
    );
  }
}
