import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getBrandByAccountId } from "@/lib/brands/queries";

// Marks one order_item (a brand's share of a customer's order) as shipped.
// RLS (order_items_update_own_brand) also enforces brand ownership — the
// explicit check below is defense in depth, and this route is deliberately
// the only place allowed to touch fulfillment_status/tracking_number.
export async function POST(request: Request, { params }: { params: Promise<{ itemId: string }> }) {
  try {
    const { itemId } = await params;
    const { trackingNumber } = await request.json().catch(() => ({ trackingNumber: undefined }));

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

    const { data: item, error: itemError } = await supabase
      .from("order_items")
      .select("id, brand_id")
      .eq("id", itemId)
      .maybeSingle();

    if (itemError) {
      return NextResponse.json({ error: itemError.message }, { status: 500 });
    }

    if (!item || item.brand_id !== brand.brand_uuid) {
      return NextResponse.json({ error: "Order item not found" }, { status: 404 });
    }

    const { error: updateError } = await supabase
      .from("order_items")
      .update({
        fulfillment_status: "shipped",
        tracking_number: typeof trackingNumber === "string" && trackingNumber.trim() ? trackingNumber.trim() : null,
        shipped_at: new Date().toISOString(),
      })
      .eq("id", itemId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to mark item as shipped" },
      { status: 500 }
    );
  }
}
