import { cn } from "@/lib/utils";
import { Shield, AlertTriangle, AlertCircle, XCircle } from "lucide-react";

const riskConfig = {
  green: {
    label: "Green",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: Shield,
    description: "Proceed – standard terms"
  },
  amber: {
    label: "Amber",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    icon: AlertTriangle,
    description: "Proceed with limits"
  },
  red: {
    label: "Red",
    color: "bg-red-50 text-red-600 border-red-200",
    icon: AlertCircle,
    description: "Only with mitigations"
  },
  high_risk: {
    label: "High Risk",
    color: "bg-red-100 text-red-800 border-red-300",
    icon: XCircle,
    description: "Do not extend credit"
  },
  fail: {
    label: "Fail",
    color: "bg-slate-100 text-slate-800 border-slate-300",
    icon: XCircle,
    description: "Manual review required"
  }
};

export default function RiskBadge({ band, showDescription = false, size = "md" }) {
  const config = riskConfig[band] || riskConfig.high_risk;
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-2 text-base"
  };

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 rounded-full border font-medium",
      config.color,
      sizeClasses[size]
    )}>
      <Icon className={size === "sm" ? "w-3 h-3" : "w-4 h-4"} />
      <span>{config.label}</span>
      {showDescription && (
        <span className="text-xs opacity-75 ml-1">• {config.description}</span>
      )}
    </div>
  );
}