export default function Marketplace() {
    return (
      <section className="marketplace" id="marketplace">
        <div className="wrap">
          <div className="marketplace-art" aria-hidden="true">
            <div className="cell"></div>
            <div className="cell"></div>
            <div className="cell"></div>
            <div className="cell"></div>
          </div>
          <div>
            <span className="eyebrow">Check out our marketplace</span>
            <h2>Don&apos;t just watch the show, wear it.</h2>
            <p className="body-text">
              Discover and purchase exclusive, limited-run pieces from past
              winners from our curated vendors. Every piece started as a
              sketch — and won its way onto the rack.
            </p>
            <a href="#marketplace" className="btn btn-solid">Shop the marketplace</a>
          </div>
        </div>
      </section>
    );
  }
  