import { Bot, Database, Workflow, Users2 } from "lucide-react";

/**
 * The hero visual: an abstract composition of connected nodes representing
 * software + data + automation + AI — deliberately not a literal dashboard
 * screenshot or a stock photo (per brief). Pure SVG + CSS (the dashed lines
 * animate via .pub-flow-line in globals.css, which respects
 * prefers-reduced-motion), so it's crisp at any size and costs nothing to
 * load — no image request at all.
 */
export function HeroVisual() {
  const nodes = [
    { icon: Users2, label: "Client", x: 20, y: 18 },
    { icon: Database, label: "Data", x: 80, y: 18 },
    { icon: Bot, label: "AI", x: 20, y: 82 },
    { icon: Workflow, label: "Automation", x: 80, y: 82 },
  ];

  return (
    <div className="pub-fade-up relative mx-auto aspect-square w-full max-w-md" aria-hidden="true">
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full overflow-visible">
        {nodes.map((node) => (
          <line
            key={node.label}
            x1="50"
            y1="50"
            x2={node.x}
            y2={node.y}
            stroke="#DE0000"
            strokeOpacity="0.35"
            strokeWidth="0.6"
            className="pub-flow-line"
          />
        ))}
        <circle cx="50" cy="50" r="9" fill="#2E2C2B" />
        {nodes.map((node) => (
          <circle key={node.label} cx={node.x} cy={node.y} r="6" fill="#FFFFFF" stroke="#E8E6E5" strokeWidth="0.5" />
        ))}
      </svg>

      {/* Center mark */}
      <div className="absolute left-1/2 top-1/2 flex h-[18%] w-[18%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl bg-charcoal-dark shadow-lg">
        <svg width="40%" height="40%" viewBox="0 0 28 28" fill="none">
          <path
            d="M20.5 6.5C18.7 4.5 16.1 3.25 13.2 3.25C7.6 3.25 3 7.85 3 13.45C3 19.05 7.6 23.65 13.2 23.65C16.1 23.65 18.7 22.4 20.5 20.4"
            stroke="#DE0000"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          <circle cx="21.5" cy="6.2" r="2.3" fill="#DE0000" />
          <circle cx="21.5" cy="20.7" r="2.3" fill="#DE0000" />
        </svg>
      </div>

      {/* Satellite node icons */}
      {nodes.map((node) => (
        <div
          key={node.label}
          className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5"
          style={{ left: `${node.x}%`, top: `${node.y}%` }}
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-hairline bg-white shadow-sm">
            <node.icon className="h-5 w-5 text-crimson" strokeWidth={1.75} />
          </div>
          <span className="text-[10px] font-medium text-charcoal-muted">{node.label}</span>
        </div>
      ))}
    </div>
  );
}
