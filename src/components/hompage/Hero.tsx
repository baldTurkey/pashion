const STATS = [
    { value: "0+", label: "Designers featured" },
    { value: "0", label: "Shows hosted" },
    { value: "0", label: "Votes this season" },
  ];
  
  export default function HPHero() {
    return (
      <section className="hero">
        <div className="wrap">
          <div>
            <span className="eyebrow">Independent designers, real production runs</span>
            <h1>
              Your sketch.
              <br />
              Their runway.
              <br />
              <em>Everyone&apos;s</em> vote.
            </h1>
            <p className="sub">
              Pashion turns fashion sketches into real, wearable pieces — voted
              into production by the people who&apos;ll actually wear them.
            </p>
            <div className="hero-ctas">
              <a href="#browse" className="btn btn-solid">View listings from brands</a>
              <a href="#how" className="btn btn-outline">How it works</a>
            </div>
            <div className="hero-stats">
              {STATS.map((stat) => (
                <div key={stat.label}>
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
  
          <div className="hero-art">
            <span className="corner-mark" aria-hidden="true"></span>
            <div className="tag">
              <span className="eyebrow">Now voting</span>
              <strong>Look 67 — HERHERHER</strong>
              <span>520 votes · closes in 2 days</span>
            </div>
          </div>
        </div>
      </section>
    );
  }
  