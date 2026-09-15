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
        {orders.map((order) => (
          <article key={order.id} className="rounded-xl border border-slate-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  order.status === "paid"
                    ? "bg-emerald-100 text-emerald-700"
                    : order.status === "failed"
                      ? "bg-red-100 text-red-700"
                      : "bg-slate-100 text-slate-600"
                }`}
              >
                {order.status === "paid" ? "Paid" : order.status === "failed" ? "Failed" : "Pending"}
              </span>
            </div>
            <p className="text-sm text-slate-500">{formatDate(order.created_at)}</p>

            <ul className="mt-3 space-y-1 text-sm text-slate-700">
              {order.order_items.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-2">
                  <span>
                    {item.product_name} &times; {item.quantity}
                    {item.fulfillment_status === "shipped" && (
                      <span className="ml-2 text-xs font-medium text-emerald-600">
                        Shipped{item.tracking_number ? ` · ${item.tracking_number}` : ""}
                      </span>
                    )}
                  </span>
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
        ))}
      </div>
    </div>
  );
}
