export default function Marketplace() {
  const assets = ["bag.png", "dresss.png", "pink.png", "zz.png"];
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  return (
    <section className="marketplace" id="marketplace">
      <div className="wrap">
        <div className="marketplace-art" aria-hidden="true">
          {assets.map((asset) => (
            <img
              key={asset}
              className="cell"
              src={`${supabaseUrl}/storage/v1/object/public/other-assets/${encodeURIComponent(asset)}`}
              alt=""
            />
          ))}
        </div>
        <div>
          <span className="eyebrow">Check out our marketplace</span>
          <h2>Don&apos;t just watch the show, wear it.</h2>
          <p className="body-text">
            Discover and purchase exclusive, limited-run pieces from past
            winners from our curated vendors. Every piece started as a sketch
            — and won its way onto the rack.
          </p>
          <a href="#marketplace" className="btn btn-solid">Shop the marketplace</a>
        </div>
      </div>
    </section>
  );
}
