import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";
import "./showdash.css";

function formatDateRange(startDate: string | null, endDate: string | null) {
  if (!startDate && !endDate) return "Dates TBD";
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const start = startDate
    ? new Date(startDate).toLocaleDateString("en-US", opts)
    : null;
  const end = endDate
    ? new Date(endDate).toLocaleDateString("en-US", opts)
    : null;
  if (start && end) return `${start} – ${end}`;
  return start || end || "Dates TBD";
}

export default async function MyShows() {
  const supabase = await createSupabaseServer();

  // testing bc of login issue
  // const {
  //   data: { session },
  // } = await supabase.auth.getSession();

  // if (!session) {
  //   redirect("/login");
  // }

  const { data: shows, error } = await supabase
    .from("shows")
    .select("id, image, quantity, category, style, startDate, endDate, created_at")
    // .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load shows:", error.message);
  }

  return (
    <div className="csdash-root">
      <div className="csdash-header">
        <h1 className="csdash-title">My shows</h1>
        <p className="csdash-subtitle">
          {shows?.length ?? 0} show{shows?.length === 1 ? "" : "s"} posted
        </p>
      </div>

      {!shows || shows.length === 0 ? (
        <div className="csdash-empty">You haven't posted a show yet.</div>
      ) : (
        <div className="csdash-grid">
          {shows.map((show) => (
            <Link
              key={show.id}
              href={`/shows/${show.id}`}
              className="csdash-card"
            >
              <div className="csdash-card-image-wrap">
                {show.image ? (
                  <img
                    src={show.image}
                    alt={show.category || "Show item"}
                    className="csdash-card-image"
                  />
                ) : (
                  <div className="csdash-card-image-placeholder">
                    No photo
                  </div>
                )}
              </div>
              <div className="csdash-card-body">
                <div className="csdash-card-name">
                  {show.category || show.style || "Untitled show"}
                </div>
                <div className="csdash-card-meta">
                  {formatDateRange(show.startDate, show.endDate)}
                </div>
                {show.quantity != null && (
                  <div className="csdash-card-quantity">
                    Qty: {show.quantity}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}