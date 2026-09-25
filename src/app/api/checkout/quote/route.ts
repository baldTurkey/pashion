import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { getActiveCartItemsForCheckout } from "@/lib/cart/queries";
import { calculateShippingQuotes, parseShippingDetails } from "@/lib/shipping/calculate";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    const shipping = parseShippingDetails(await request.json());
    const items = await getActiveCartItemsForCheckout(supabase, user.id);
    if (items.length === 0) return NextResponse.json({ error: "Cart is empty" }, { status: 400 });

    const quote = await calculateShippingQuotes(getAdminClient(), items, shipping);
    return NextResponse.json(quote);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to calculate shipping" },
      { status: 400 }
    );
  }
}