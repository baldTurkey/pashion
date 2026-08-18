import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getCartItems } from "@/lib/cart/queries";
import { CartClient } from "./cart-client";

// Server component: fetches the real cart from the DB, then hands it to
// CartClient for all the interactive bits.
export default async function CartPage() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const items = await getCartItems(supabase, user.id);

  return <CartClient initialItems={items} />;
}
