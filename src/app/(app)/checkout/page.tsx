import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getCartItems } from "@/lib/cart/queries";
import { CheckoutClient } from "./checkout-client";
import { getCustomerDeliveryName, parseCustomerContactInfo } from "@/lib/customers/contact-info";

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

  const { data: customer } = await supabase
    .from("customers")
    .select("contact_info")
    .eq("customer_uuid", user.id)
    .maybeSingle();
  const contactInfo = parseCustomerContactInfo(customer?.contact_info);
  const initialShipping = {
    shippingName: getCustomerDeliveryName(contactInfo),
    shippingAddress: contactInfo.location ?? "",
    shippingCity: contactInfo.shipping_city ?? "",
    shippingRegion: contactInfo.shipping_region ?? "",
    shippingPostalCode: contactInfo.shipping_postal_code ?? "",
    shippingCountry: contactInfo.shipping_country ?? "",
  };

  return <CheckoutClient items={items} subtotal={subtotal} initialShipping={initialShipping} />;
}
