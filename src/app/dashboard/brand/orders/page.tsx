import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getBrandByAccountId } from "@/lib/brands/queries";
import { getOrderItemsForBrand } from "@/lib/orders/queries";
import { MarkShippedForm } from "@/components/brand/mark-shipped-form";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default async function BrandOrdersPage() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-up/brand");
  }

  const brand = await getBrandByAccountId(supabase, user.id);

  if (!brand) {
    redirect("/sign-up/brand");
  }

  const items = await getOrderItemsForBrand(supabase, brand.brand_uuid);

  return (
    <div>
      <h1 className="bv-page-title">Orders</h1>

      {items.length === 0 ? (
        <div className="bv-placeholder-box">Orders will show up here once a customer buys something.</div>
      ) : (
        <table className="bv-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Item</th>
              <th>Qty</th>
              <th>Total</th>
              <th>Ship to</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  {item.order ? formatDate(item.order.created_at) : "—"}
                  <div className="text-xs text-tobago-70">#{item.order?.id.slice(0, 8) ?? "unknown"}</div>
                </td>
                <td>{item.product_name}</td>
                <td>{item.quantity}</td>
                <td>
                  ${((item.unit_price_cents * item.quantity + item.shipping_cents) / 100).toFixed(2)}
                  {item.shipping_cents > 0 && (
                    <div className="text-xs text-tobago-70">
                      Includes ${(item.shipping_cents / 100).toFixed(2)} shipping
                    </div>
                  )}
                </td>
                <td>
                  {item.order ? (
                    <>
                      {item.order.shipping_name}
                      <div className="text-xs text-tobago-70">
                        {item.order.shipping_address}, {item.order.shipping_city}, {item.order.shipping_region}{" "}
                        {item.order.shipping_postal_code}
                      </div>
                    </>
                  ) : (
                    "—"
                  )}
                </td>
                <td>
                  {item.fulfillment_status === "shipped" ? (
                    <span>
                      Shipped
                      {item.tracking_number && (
                        <div className="text-xs text-tobago-70">{item.tracking_number}</div>
                      )}
                    </span>
                  ) : (
                    <MarkShippedForm itemId={item.id} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
