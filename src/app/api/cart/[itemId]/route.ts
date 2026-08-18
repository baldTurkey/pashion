import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { removeCartItem, updateCartItem } from "@/lib/cart/queries";

// PATCH: change quantity and/or toggle "saved for later" on one cart row.
export async function PATCH(request: Request, { params }: { params: Promise<{ itemId: string }> }) {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }

    const { itemId } = await params;
    const { quantity, savedForLater } = await request.json();

    await updateCartItem(supabase, user.id, itemId, { quantity, savedForLater });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update cart item" },
      { status: 500 }
    );
  }
}

// DELETE: remove one item from the cart entirely.
export async function DELETE(_request: Request, { params }: { params: Promise<{ itemId: string }> }) {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }

    const { itemId } = await params;
    await removeCartItem(supabase, user.id, itemId);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to remove cart item" },
      { status: 500 }
    );
  }
}
