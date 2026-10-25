import type { Tier } from "@/lib/scoring";
import { cn } from "@/lib/utils";

const tone: Record<Tier, string> = {
  elite: "var(--success)",
  standard: "var(--warning)",
  "at-risk": "var(--destructive)",
  none: "var(--muted-foreground)",
};

/** Circular score gauge, 0–100, coloured by tier. */
export function ScoreRing({
  score,
  tier,
  size = 112,
  stroke = 10,
  className,
}: {
  score: number | null;
  tier: Tier;
  size?: number;
  stroke?: number;
  className?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const value = score === null ? 0 : Math.max(0, Math.min(100, score));
  return (
    <div
      className={cn("relative inline-grid place-items-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--muted)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tone[tier]}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - value / 100)}
          style={{ transition: "stroke-dashoffset .6s ease" }}
        />
      </svg>
      <div className="absolute text-center">
        <p className="num font-display font-bold leading-none" style={{ fontSize: size * 0.28 }}>
          {score === null ? "—" : Math.round(score)}
        </p>
        {size >= 80 && (
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            score
          </p>
        )}
      </div>
    </div>
  );
}
