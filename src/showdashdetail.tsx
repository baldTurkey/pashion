import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";
import "./showdashdetail.css";

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function ShowDetail({ id }: { id: string }) {
  const supabase = await createSupabaseServer();

  // testing bc of login issue
  // const {
  //   data: { session },
  // } = await supabase.auth.getSession();

  // if (!session) {
  //   redirect("/login");
  // }

  const { data: show, error } = await supabase
    .from("shows")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !show) {
    notFound();
  }

  // Only the creator can view this page. Drop this check (and instead
  // adjust the RLS select policy) if you want shows to be publicly
  // browsable.
  // if (show.user_id !== session.user.id) {
  //   notFound();
  // }

  const dateRangeStart = formatDate(show.startDate);
  const dateRangeEnd = formatDate(show.endDate);

  return (
    <div className="sddash-root">
      <Link href="/shows/brand" className="sddash-back">
        &larr; Back to your shows
      </Link>

      {show.image && (
        <div className="sddetail-gallery">
          <img
            src={show.image}
            alt={show.category || "Show item"}
            className="sddetail-photo"
          />
        </div>
      )}

      <div className="sddetail-body">
        <h1 className="sddetail-name">
          {show.category || show.style || "Untitled show"}
        </h1>

        {(dateRangeStart || dateRangeEnd) && (
          <div className="sddetail-dates">
            {dateRangeStart}
            {dateRangeStart && dateRangeEnd ? " – " : ""}
            {dateRangeEnd}
          </div>
        )}

        <div className="sddetail-row">
          <div>
            <div className="sddetail-label">Quantity</div>
            <div className="sddetail-text">{show.quantity ?? "—"}</div>
          </div>
          <div>
            <div className="sddetail-label">Style</div>
            <div className="sddetail-text">{show.style || "—"}</div>
          </div>
        </div>

        <div className="sddetail-section">
          <div className="sddetail-label">Event description</div>
          <p className="sddetail-text">
            {show.eventDiscription || "No description provided."}
          </p>
        </div>

        <div className="sddetail-section">
          <div className="sddetail-label">Materials</div>
          <p className="sddetail-text">
            {show.materials || "Not specified."}
          </p>
        </div>

        <div className="sddetail-posted">
          Posted {new Date(show.created_at).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}