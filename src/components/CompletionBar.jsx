import { Progress } from "@/components/ui/progress";

export default function CompletionBar({ score }) {
  const getColor = () => {
    if (score >= 80) return "text-emerald-600";
    if (score >= 50) return "text-amber-600";
    return "text-red-500";
  };

  return (
    <div className="flex items-center gap-3 w-full">
      <div className="flex-1">
        <Progress value={score} className="h-2.5" />
      </div>
      <span className={`text-sm font-bold tabular-nums min-w-[48px] text-left ${getColor()}`}>
        {Math.round(score)}%
      </span>
    </div>
  );
}