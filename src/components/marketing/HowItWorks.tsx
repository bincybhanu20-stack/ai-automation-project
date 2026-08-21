const STEPS = [
  { number: "01", title: "Discover", description: "Understand the business, audience and objectives." },
  { number: "02", title: "Plan", description: "Develop the right website and digital strategy." },
  { number: "03", title: "Build", description: "Design and develop the digital experience." },
  { number: "04", title: "Launch", description: "Launch the website and marketing campaigns." },
  { number: "05", title: "Grow", description: "Analyze performance and continuously optimize." },
] as const;

export function HowItWorks() {
  return (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
      {STEPS.map((step) => (
        <div key={step.number}>
          <span className="text-3xl font-bold text-crimson/25">{step.number}</span>
          <h3 className="mt-2 text-base font-semibold text-charcoal-dark">{step.title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-charcoal">{step.description}</p>
        </div>
      ))}
    </div>
  );
}
