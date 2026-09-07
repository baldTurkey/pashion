const ANNOUNCEMENTS = [
    "New season open for submissions",
    "Vote on this week's looks",
    "Winning designs now shipping",
  ];
  
  // Rendered twice back-to-back so the CSS marquee (-50%) loops seamlessly.
  export default function Ticker() {
    const items = [...ANNOUNCEMENTS, ...ANNOUNCEMENTS];
  
    return (
      <div className="ticker" role="marquee" aria-label="Announcements">
        <div className="ticker-track">
          {items.map((text, i) => (
            <span key={i}>{text}</span>
          ))}
        </div>
      </div>
    );
  }
  