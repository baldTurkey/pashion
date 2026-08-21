import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { addCartItem } from "@/lib/cart/queries";

// Adds a product to the current user's cart (or bumps quantity if it's
// already in there).
export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }

    const { productId, quantity } = await request.json();

    if (!productId) {
      return NextResponse.json({ error: "Missing productId" }, { status: 400 });
    }

    await addCartItem(supabase, user.id, productId, quantity ?? 1);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to add to cart" },
      { status: 500 }
    );
  }
}
