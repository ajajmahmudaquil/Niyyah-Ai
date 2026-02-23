import { Badge } from "@/components/ui/badge";

export function ConsistencyBadge({ score }: { score: number }) {
  let label = "Behind";
  let className = "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20";

  if (score >= 75) {
    label = "Excellent";
    className = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
  } else if (score >= 50) {
    label = "On Track";
    className = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
  }

  return (
    <Badge variant="outline" className={className} data-testid="badge-consistency">
      {Math.round(score)}% - {label}
    </Badge>
  );
}

export function ConsistencyBar({ score }: { score: number }) {
  let color = "bg-red-500";
  if (score >= 75) color = "bg-emerald-500";
  else if (score >= 50) color = "bg-amber-500";

  return (
    <div className="w-full h-2 rounded-full bg-muted" data-testid="bar-consistency">
      <div
        className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${Math.min(100, score)}%` }}
      />
    </div>
  );
}
