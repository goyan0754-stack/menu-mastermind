import { useEffect, useState } from "react";

type Props = { score: number };

export function ScoreGauge({ score }: Props) {
  const [display, setDisplay] = useState(0);
  const size = 200;
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    const start = performance.now();
    const duration = 900;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(score * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  const offset = circumference - (display / 100) * circumference;
  const color =
    score >= 90 ? "var(--brand-olive)" :
    score >= 70 ? "var(--brand-olive)" :
    score >= 50 ? "var(--brand-gold)" :
    "oklch(0.55 0.18 25)";

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="oklch(0.9 0.012 85)"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.05s linear" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-semibold" style={{ color: "var(--brand-dark)" }}>{display}</span>
        <span className="text-sm" style={{ color: "var(--brand-dark)", opacity: 0.6 }}>/ 100</span>
      </div>
    </div>
  );
}
