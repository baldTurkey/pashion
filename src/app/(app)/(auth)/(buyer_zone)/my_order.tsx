import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getOrdersWithItemsForCustomer } from "@/lib/orders/queries";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Fulfillment happens per order_item (per brand's share of the order), so an
// order with items from two brands can be "partially shipped" — surface that
// instead of collapsing it into one misleading yes/no.
function getFulfillmentSummary(items: { fulfillment_status: string }[]) {
  const shippedCount = items.filter((item) => item.fulfillment_status === "shipped").length;

  if (shippedCount === 0) {
    return { label: "Preparing your order", tone: "pending" as const };
  }
  if (shippedCount === items.length) {
    return { label: "Shipped", tone: "shipped" as const };
  }
  return { label: `${shippedCount} of ${items.length} items shipped`, tone: "partial" as const };
}

const FULFILLMENT_STYLES = {
  pending: "bg-slate-100 text-slate-600",
  partial: "bg-amber-100 text-amber-700",
  shipped: "bg-emerald-100 text-emerald-700",
};

export default async function MyOrder() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const orders = await getOrdersWithItemsForCustomer(supabase, user.id);

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-2xl font-semibold">Your Orders</h2>

      {orders.length === 0 && <p className="text-slate-500">No orders found yet.</p>}

      <div className="space-y-4">
        {orders.map((order) => {
          const fulfillment = order.status === "paid" ? getFulfillmentSummary(order.order_items) : null;

          return (
            <article key={order.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
                  <p className="text-sm text-slate-500">{formatDate(order.created_at)}</p>
                </div>

                <div className="flex flex-col items-end gap-1">
                  {fulfillment ? (
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${FULFILLMENT_STYLES[fulfillment.tone]}`}
                    >
                      {fulfillment.label}
                    </span>
                  ) : (
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        order.status === "failed" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {order.status === "failed" ? "Payment failed" : "Payment pending"}
                    </span>
                  )}
                </div>
              </div>

              <ul className="mt-3 divide-y divide-slate-100">
                {order.order_items.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-3 py-2 text-sm text-slate-700">
                    <div className="min-w-0">
                      <p className="truncate">
                        {item.product_name} &times; {item.quantity}
                      </p>
                      {order.status === "paid" && (
                        <p
                          className={`mt-0.5 text-xs font-medium ${
                            item.fulfillment_status === "shipped" ? "text-emerald-600" : "text-slate-400"
                          }`}
                        >
                          {item.fulfillment_status === "shipped"
                            ? `Shipped${item.tracking_number ? ` · Tracking: ${item.tracking_number}` : ""}`
                            : "Preparing to ship"}
                        </p>
                      )}
                    </div>
                    <span className="whitespace-nowrap">
                      ${((item.unit_price_cents * item.quantity) / 100).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
                <span className="text-slate-500">
                  {order.shipping_address
                    ? `${order.shipping_address}, ${order.shipping_city}, ${order.shipping_region} ${order.shipping_postal_code}`
                    : "No shipping address on file"}
                </span>
                <span className="font-semibold text-slate-900">${(order.subtotal_cents / 100).toFixed(2)}</span>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

}
