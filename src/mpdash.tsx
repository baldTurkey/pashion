import { redirect } from "next/navigation";
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
    .from("mpformlistings")
    .select("id, item_name, price, photo_urls, created_at")
    // .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load listings:", error.message);
  }

  return (
    <div className="mpdash-root">
      <div className="mpdash-header">
        <h1 className="mpdash-title">Your listings</h1>
        <p className="mpdash-subtitle">
          {listings?.length ?? 0} item{listings?.length === 1 ? "" : "s"} posted
        </p>
      </div>

      {!listings || listings.length === 0 ? (
        <div className="mpdash-empty">You haven't posted anything yet.</div>
      ) : (
        <div className="mpdash-grid">
          {listings.map((listing) => (
            <Link
              key={listing.id}
              href={`/listings/${listing.id}`}
              className="mpdash-card"
            >
              <div className="mpdash-card-image-wrap">
                {listing.photo_urls?.[0] ? (
                  <img
                    src={listing.photo_urls[0]}
                    alt={listing.item_name}
                    className="mpdash-card-image"
                  />
                ) : (
                  <div className="mpdash-card-image-placeholder">
                    No photo
                  </div>
                )}
              </div>
              <div className="mpdash-card-body">
                <div className="mpdash-card-name">{listing.item_name}</div>
                <div className="mpdash-card-price">
                  ${Number(listing.price).toFixed(2)}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}