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
      // Accounts v2 API (v1 accounts.create is deprecated for new Connect integrations).
      const account = await getStripe().v2.core.accounts.create({
        contact_email: user.email,
        display_name: brand.company_name,
        dashboard: "express",
        // Express dashboard requires the platform (not Stripe) to collect fees/cover losses.
        defaults: {
          responsibilities: { fees_collector: "application", losses_collector: "application" },
        },
        // No country field is collected from brands yet; Stripe onboarding lets them confirm/correct it.
        identity: { country: "US", entity_type: "individual" },
        configuration: {
          // card_payments also grants payouts (stripe_balance.payouts) — that capability isn't requestable directly.
          merchant: {
            capabilities: {
              card_payments: { requested: true },
            },
          },
          // Lets the platform's transfers.create(destination: ...) pay this brand out of the platform balance.
          recipient: {
            capabilities: {
              stripe_balance: { stripe_transfers: { requested: true } },
            },
          },
        },
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
    const accountLink = await getStripe().v2.core.accountLinks.create({
      account: stripeAccountId,
      use_case: {
        type: "account_onboarding",
        account_onboarding: {
          configurations: ["merchant", "recipient"],
          refresh_url: `${origin}/brand/dashboard?stripe=refresh`,
          return_url: `${origin}/brand/dashboard?stripe=return`,
        },
      },
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to start Stripe onboarding" },
      { status: 500 }
    );
  }
}
