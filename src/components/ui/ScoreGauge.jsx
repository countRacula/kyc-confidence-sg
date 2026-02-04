import { cn } from "@/lib/utils";

export default function ScoreGauge({ score, size = "lg" }) {
  const getColor = (s) => {
    if (s >= 80) return "text-emerald-500";
    if (s >= 60) return "text-amber-500";
    if (s >= 40) return "text-red-500";
    return "text-red-700";
  };

  const getStrokeColor = (s) => {
    if (s >= 80) return "#10b981";
    if (s >= 60) return "#f59e0b";
    if (s >= 40) return "#ef4444";
    return "#b91c1c";
  };

  const sizeConfig = {
    sm: { width: 80, strokeWidth: 6, fontSize: "text-lg" },
    md: { width: 120, strokeWidth: 8, fontSize: "text-2xl" },
    lg: { width: 180, strokeWidth: 12, fontSize: "text-4xl" }
  };

  const config = sizeConfig[size];
  const radius = (config.width - config.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={config.width} height={config.width} className="-rotate-90">
        <circle
          cx={config.width / 2}
          cy={config.width / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={config.strokeWidth}
        />
        <circle
          cx={config.width / 2}
          cy={config.width / 2}
          r={radius}
          fill="none"
          stroke={getStrokeColor(score)}
          strokeWidth={config.strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("font-bold", config.fontSize, getColor(score))}>
          {Math.round(score)}
        </span>
        <span className="text-xs text-slate-500 font-medium">/ 100</span>
      </div>
    </div>
  );
}