import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";

export default async function BrandOverviewPage() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: brand } = user
    ? await supabase.from("brands").select("brand_uuid").eq("account_id", user.id).maybeSingle()
    : { data: null };

  const { data: inventory } = brand?.brand_uuid
    ? await supabase
        .from("inventory")
        .select("id, name, stock, supply, ready_to_sell_date")
        .eq("brand_id", brand.brand_uuid)
        .order("created_at", { ascending: false })
        .limit(5)
    : { data: [] };

  const { data: listings } = await supabase
    .from("products")
    .select("id, name, currentPrice")
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: shows } = await supabase
    .from("shows")
    .select("id, category, style, startDate, endDate")
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <div>
      <div className="bv-page-header">
        <h1 className="bv-page-title">Overview</h1>
        <Link href="/brand/dashboard" className="bv-btn">
          Back to Brand Dashboard
        </Link>
      </div>

      <div className="bv-grid">
          <div className="bv-card">
          <div className="bv-card-header">
            <h2 className="bv-card-title">Inventory</h2>
            <Link href="/dashboard/brand/inventory" className="bv-card-link">
              View all
            </Link>
          </div>
          <table className="bv-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Qty</th>
              </tr>
            </thead>
            <tbody>
              {!inventory || inventory.length === 0 ? (
                <tr>
                  <td colSpan={2} className="bv-empty-row">
                    No inventory yet
                  </td>
                </tr>
              ) : (
                inventory.map((item) => {
                  const supplyTotal = Number(item.supply?.[0]);
                  const quantity = Number.isFinite(supplyTotal) ? supplyTotal : item.stock ?? 0;

                  return (
                    <tr key={item.id}>
                      <td>
                        <Link href="/dashboard/brand/inventory" className="bv-row-link">
                          {item.name || "Untitled item"}
                        </Link>
                      </td>
                      <td>{quantity}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="bv-card">
          <div className="bv-card-header">
            <h2 className="bv-card-title">My listings</h2>
            <Link href="/dashboard/brand/listings" className="bv-card-link">
              View all
            </Link>
          </div>
          <table className="bv-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              {!listings || listings.length === 0 ? (
                <tr>
                  <td colSpan={2} className="bv-empty-row">
                    No listings yet
                  </td>
                </tr>
              ) : (
                listings.map((listing) => (
                  <tr key={listing.id}>
                    <td>{listing.name}</td>
                    <td>${Number(listing.currentPrice).toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="bv-card">
          <div className="bv-card-header">
            <h2 className="bv-card-title">Shows</h2>
            <Link href="/dashboard/brand/shows" className="bv-card-link">
              View all
            </Link>
          </div>
          <table className="bv-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Dates</th>
              </tr>
            </thead>
            <tbody>
              {!shows || shows.length === 0 ? (
                <tr>
                  <td colSpan={2} className="bv-empty-row">
                    No shows yet
                  </td>
                </tr>
              ) : (
                shows.map((show) => (
                  <tr key={show.id}>
                    <td>{show.category || show.style || "Untitled"}</td>
                    <td>
                      {show.startDate && show.endDate 
                        ? `${new Date(show.startDate).toLocaleDateString()} - ${new Date(show.endDate).toLocaleDateString()}`
                        : "Dates TBD"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="bv-card">
          <div className="bv-card-header">
            <h2 className="bv-card-title">Orders</h2>
            <Link href="/dashboard/brand/orders" className="bv-card-link">
              View all
            </Link>
          </div>
          <table className="bv-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Item</th>
                <th>Qty</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={3} className="bv-empty-row">
                  No orders yet
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}