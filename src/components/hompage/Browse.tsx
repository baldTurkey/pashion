interface Listing {
    brand: string;
    title: string;
    status: string;
    meta: string;
    gradient: string;
  }
  
  const LISTINGS: Listing[] = [
    {
      brand: "Hannah Thomas",
      title: "Look 67 — 676767",
      status: "Voting",
      meta: "123 votes",
      gradient: "linear-gradient(160deg, var(--rose), var(--vanilla))",
    },
    {
      brand: "Shore-ee-ya",
      title: "Look 520 — AWW",
      status: "Voting",
      meta: "456 votes",
      gradient: "linear-gradient(160deg, var(--silver), var(--vanilla))",
    },
    {
      brand: "P Money",
      title: "Look 13 — Bad luck",
      status: "Winner",
      meta: "In production",
      gradient: "linear-gradient(160deg, var(--tobago), var(--rose))",
    },
    {
      brand: "Air-In-Der-Sky",
      title: "Look 7 — Prime Number",
      status: "Voting",
      meta: "789 votes",
      gradient: "linear-gradient(160deg, var(--vanilla), var(--silver))",
    },
  ];
  
  export default function Browse() {
    return (
      <section className="browse" id="browse">
        <div className="wrap">
          <div className="section-head">
            <div className="copy">
              <span className="eyebrow">This season&apos;s shows</span>
              <h2>View listings from brands</h2>
            </div>
            <a href="#shows" className="btn btn-outline">Browse all listings</a>
          </div>
  
          <div className="listing-grid" id="shows">
            {LISTINGS.map((item) => (
              <article className="listing-card" key={item.title}>
                <div className="listing-thumb" style={{ background: item.gradient }}>
                  <span className="vote-badge">{item.status}</span>
                </div>
                <div className="listing-info">
                  <span className="brand">{item.brand}</span>
                  <h4>{item.title}</h4>
                  <span className="price">{item.meta}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  }
  