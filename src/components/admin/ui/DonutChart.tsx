interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
}

/**
 * Dependency-free SVG donut chart — plain stroke-dasharray circles, no
 * charting library. Keeps the admin bundle small for what's a single,
 * fairly simple visualization need.
 */
export function DonutChart({ data, size = 160, strokeWidth = 22, centerLabel }: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulative = 0;
  const segments = data
    .filter((d) => d.value > 0)
    .map((d) => {
      const dash = (d.value / total) * circumference;
      const offset = -cumulative;
      cumulative += dash;
      return { ...d, dash, offset };
    });

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#F8F8F8" strokeWidth={strokeWidth} />
          {total > 0 &&
            segments.map((s) => (
              <circle
                key={s.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={s.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${s.dash} ${circumference - s.dash}`}
                strokeDashoffset={s.offset}
              />
            ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-charcoal-dark">{total}</span>
          {centerLabel && <span className="text-xs text-charcoal-muted">{centerLabel}</span>}
        </div>
      </div>

      <ul className="w-full flex-1 space-y-2">
        {data.map((d) => (
          <li key={d.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 text-charcoal">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: d.color }} />
              {d.label}
            </span>
            <span className="font-medium text-charcoal-dark">
              {d.value}
              {total > 0 && (
                <span className="ml-1 text-charcoal-muted">({Math.round((d.value / total) * 100)}%)</span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
