import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";
import "./mpdash.css";

export default async function Mpdash() {
  const supabase = await createSupabaseServer();

  //testing bc of login issue
  // const {
    // data: { session },
  // } = await supabase.auth.getSession();

  // if (!session) {
   // redirect("/login");
  // }

  const { data: listings, error } = await supabase
    .from("products")
    .select("id, name, currentPrice, imageUrl, created_at")
    // .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load listings:", error.message);
  }

console.log("DEBUG listings:", listings);
console.log("DEBUG error:", JSON.stringify(error, null, 2));

  return (
    <div className="mpdash-root">
      <div className="mpdash-header">
        <h1 className="mpdash-title">My listings</h1>
        <p className="mpdash-subtitle">
          {listings?.length ?? 0} item{listings?.length === 1 ? "" : "s"} posted
        </p>
        
        <div className="mpdash-action-row" style={{ marginTop: '12px' }}>
          <Link href="/dashboard/brand/listings/new" className="bv-btn bv-btn-primary">
            Create new listing
          </Link>
        </div>
      </div>

      {!listings || listings.length === 0 ? (
        <div className="mpdash-empty">You haven't posted anything yet.</div>
      ) : (
        <div className="mpdash-grid">
          {listings.map((listing) => (
            <Link
              key={listing.id}
              href={`/dashboard/brand/listings/${listing.id}`}
              className="mpdash-card"
            >
              <div className="mpdash-card-image-wrap">
              {listing.imageUrl ? (
                  <img
                    src={listing.imageUrl}
                    alt={listing.name}
                    className="mpdash-card-image"
                  />
                ) : (
                  <div className="mpdash-card-image-placeholder">
                    No photo
                  </div>
                )}
              </div>
              <div className="mpdash-card-body">
                <div className="mpdash-card-name">{listing.name}</div>
                <div className="mpdash-card-price">
                  ${Number(listing.currentPrice).toFixed(2)}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}