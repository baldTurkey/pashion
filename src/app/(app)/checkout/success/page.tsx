import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // RLS (orders_select_own) already limits this to the logged-in user's own
  // orders, so no extra customer_id filter is needed here.
  const { data: order } = sessionId
    ? await supabase
        .from("orders")
        .select("id, status, subtotal_cents")
        .eq("stripe_checkout_session_id", sessionId)
        .maybeSingle()
    : { data: null };

  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <Card className="p-8">
        {order ? (
          <>
            <h1 className="font-serif text-2xl text-brand-ink">
              {order.status === "paid" ? "Order confirmed!" : "Order received"}
            </h1>
            <p className="mt-2 text-brand-ink/70">
              {order.status === "paid"
                ? `We've charged $${(order.subtotal_cents / 100).toFixed(2)} and a confirmation email is on its way.`
                : "We're still confirming your payment with Stripe — this usually takes a few seconds. Refresh if this doesn't update."}
            </p>
            <p className="mt-1 text-xs text-brand-ink/40">Order #{order.id.slice(0, 8)}</p>
          </>
        ) : (
          <>
            <h1 className="font-serif text-2xl text-brand-ink">Order not found</h1>
            <p className="mt-2 text-brand-ink/70">We couldn&apos;t find that order.</p>
          </>
        )}
        <Link
          href="/"
          className="mt-6 inline-flex rounded-full bg-brand-accent px-6 py-2.5 text-white hover:bg-brand-olive-dark"
        >
          Continue shopping
        </Link>
      </Card>
    </div>
  );
}
