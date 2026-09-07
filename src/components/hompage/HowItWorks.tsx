interface Step {
    label: string;
    number: string;
    title: string;
    description: string;
  }
  
  const STEPS: Step[] = [
    {
      label: "Step One",
      number: "01",
      title: "Submit the look",
      description:
        "Designers submit their original concepts into exclusive fashion shows hosted by top brands.",
    },
    {
      label: "Step Two",
      number: "02",
      title: "The public votes",
      description:
        "The community decides on their favorite looks — the top designs get greenlit for production.",
    },
    {
      label: "Step Three",
      number: "03",
      title: "The look ships",
      description:
        "Winning designs are manufactured and transformed into real, high-quality products.",
    },
  ];
  
  export default function HowItWorks() {
    return (
      <section className="how" id="how">
        <div className="wrap">
          <div className="section-head center">
            <span className="eyebrow">The process</span>
            <h2>From sketch to style</h2>
          </div>
  
          <div className="steps">
            {STEPS.map((step) => (
              <div className="step" key={step.number}>
                <span className="look-label">{step.label}</span>
                <div className="look-no">{step.number}</div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }
  