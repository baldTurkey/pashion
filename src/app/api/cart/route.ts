import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { addCartItem } from "@/lib/cart/queries";

// Adds a listing to the current user's cart (or bumps quantity if it's
// already in there). Not wired to any UI yet — there's no product browse
// page — but this is what a future "Add to Cart" button will call.
export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }

    const { listingId, quantity } = await request.json();

    if (!listingId) {
      return NextResponse.json({ error: "Missing listingId" }, { status: 400 });
    }

    await addCartItem(supabase, user.id, listingId, quantity ?? 1);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to add to cart" },
      { status: 500 }
    );
  }
}
