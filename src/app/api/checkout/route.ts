import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { getActiveCartItemsForCheckout } from "@/lib/cart/queries";
import { createPendingOrder, attachStripeSession } from "@/lib/orders/queries";
import { getStripe } from "@/lib/stripe/server";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }

    const shipping = await request.json();
    const required = [
      "shippingName",
      "shippingAddress",
      "shippingCity",
      "shippingRegion",
      "shippingPostalCode",
      "shippingCountry",
    ] as const;

    for (const field of required) {
      if (!shipping[field]) {
        return NextResponse.json({ error: `Missing ${field}` }, { status: 400 });
      }
    }

    // Re-read the cart server-side rather than trusting anything the client
    // could have sent — prices/quantities always come from the database.
    const items = await getActiveCartItemsForCheckout(supabase, user.id);

    if (items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // orders/order_items have no insert policy for regular users — only the service role can write them.
    const adminClient = getAdminClient();
    const { orderId } = await createPendingOrder(adminClient, user.id, items, shipping);

    const origin = new URL(request.url).origin;
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      customer_email: user.email,
      line_items: items.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: "usd",
          unit_amount: item.unitPriceCents,
          product_data: { name: item.name },
        },
      })),
      metadata: { order_id: orderId },
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout`,
    });

    await attachStripeSession(adminClient, orderId, session.id);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to start checkout" },
      { status: 500 }
    );
  }
}
