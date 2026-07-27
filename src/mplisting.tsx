import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";
import "./mpdash.css";

export default async function Mplisting({ id }: { id: string }) {
  const supabase = await createSupabaseServer();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  //testing for 404 logni issue
  // if (!session) {
   // redirect("/login");
  // }

  const { data: listing, error } = await supabase
    .from("mpformlistings")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !listing) {
    notFound();
  }

  // Only the creator can view this page. Drop this check (and instead
  // adjust the RLS select policy) if you want listings to be publicly
  // browsable like an actual marketplace.
  // testing bc of /login issue
   // if (listing.user_id !== session.user.id) {
    // notFound();
 // }

  return (
    <div className="mpdash-root">
      <Link href="/dashboard" className="mpdash-back">
        &larr; Back to your listings
      </Link>

      {listing.photo_urls?.length > 0 && (
        <div className="mpdetail-gallery">
          {listing.photo_urls.map((url: string, idx: number) => (
            <img
              key={idx}
              src={url}
              alt={`${listing.item_name} photo ${idx + 1}`}
              className="mpdetail-photo"
            />
          ))}
        </div>
      )}

      <div className="mpdetail-body">
        <h1 className="mpdetail-name">{listing.item_name}</h1>
        <div className="mpdetail-price">
          ${Number(listing.price).toFixed(2)}
        </div>

        <div className="mpdetail-section">
          <div className="mpdetail-label">Description</div>
          <p className="mpdetail-text">{listing.description}</p>
        </div>

        <div className="mpdetail-row">
          <div>
            <div className="mpdetail-label">Size</div>
            <div className="mpdetail-text">{listing.size}</div>
          </div>
          <div>
            <div className="mpdetail-label">Style</div>
            <div className="mpdetail-text">{listing.style}</div>
          </div>
        </div>

        {listing.size_guide_url && (
          <div className="mpdetail-section">
            <div className="mpdetail-label">Size guide</div>
            <a
              href={listing.size_guide_url}
              target="_blank"
              rel="noreferrer"
              className="mpdetail-link"
            >
              View size guide
            </a>
          </div>
        )}

        <div className="mpdetail-section">
          <div className="mpdetail-label">Care & info</div>
          <p className="mpdetail-text">{listing.care_info}</p>
        </div>

        <div className="mpdetail-posted">
          Posted {new Date(listing.created_at).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}