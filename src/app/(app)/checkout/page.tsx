import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getCartItems } from "@/lib/cart/queries";
import { CheckoutClient } from "./checkout-client";

export default async function CheckoutPage() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const items = (await getCartItems(supabase, user.id)).filter((item) => !item.savedForLater);

  if (items.length === 0) {
    redirect("/cart");
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return <CheckoutClient items={items} subtotal={subtotal} />;
}
