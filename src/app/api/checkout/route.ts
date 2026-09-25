import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { getActiveCartItemsForCheckout } from "@/lib/cart/queries";
import { createPendingOrder, attachStripeSession } from "@/lib/orders/queries";
import { getStripe } from "@/lib/stripe/server";
import { calculateShippingQuotes, parseShippingDetails } from "@/lib/shipping/calculate";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }

    const shipping = parseShippingDetails(await request.json());

    // Re-read the cart server-side rather than trusting anything the client
    // could have sent — prices/quantities always come from the database.
    const items = await getActiveCartItemsForCheckout(supabase, user.id);

    if (items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // Stock is nullable/untracked for older listings — only block checkout
    // for products that actually declare a tracked quantity.
    const { data: stockRows, error: stockError } = await supabase
      .from("products")
      .select("product_id, name, stock")
      .in(
        "product_id",
        items.map((item) => item.productId)
      );

    if (stockError) {
      return NextResponse.json({ error: stockError.message }, { status: 500 });
    }

    const stockByProductId = new Map((stockRows ?? []).map((row) => [row.product_id, row.stock]));
    const insufficient = items.filter((item) => {
      const stock = stockByProductId.get(item.productId);
      return typeof stock === "number" && stock < item.quantity;
    });

    if (insufficient.length > 0) {
      return NextResponse.json(
        {
          error: `Not enough stock for: ${insufficient.map((item) => item.name).join(", ")}. Please update your cart quantities.`,
        },
        { status: 409 }
      );
    }

    // orders/order_items have no insert policy for regular users — only the service role can write them.
    const adminClient = getAdminClient();
    const shippingResult = await calculateShippingQuotes(adminClient, items, shipping);
    const { orderId } = await createPendingOrder(
      adminClient,
      user.id,
      items,
      shipping,
      shippingResult.quotes,
      shippingResult.destination
    );

    const origin = new URL(request.url).origin;
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      customer_email: user.email,
      line_items: [
        ...items.map((item) => ({
          quantity: item.quantity,
          price_data: {
            currency: "usd",
            unit_amount: item.unitPriceCents,
            product_data: { name: item.name },
          },
        })),
        ...shippingResult.quotes.map((quote) => ({
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: quote.amountCents,
            product_data: { name: `Shipping from ${quote.brandName}` },
          },
        })),
      ],
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
