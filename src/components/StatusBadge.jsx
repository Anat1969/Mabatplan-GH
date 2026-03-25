import { Badge } from "@/components/ui/badge";

const STATUS_CONFIG = {
  draft: { label: "טיוטה", className: "bg-slate-100 text-slate-600 border-slate-200" },
  in_progress: { label: "בעבודה", className: "bg-blue-50 text-blue-700 border-blue-200" },
  pending_review: { label: "ממתין לבדיקה", className: "bg-amber-50 text-amber-700 border-amber-200" },
  approved: { label: "אושר", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  rejected: { label: "נדחה", className: "bg-red-50 text-red-700 border-red-200" },
};

const PLAN_TYPE_LABELS = {
  new: "תוכנית חדשה",
  change: "שינוי תוכנית",
  consolidation: "איחוד",
  parcellation: "חלוקה",
};

export function getPlanTypeLabel(type) {
  return PLAN_TYPE_LABELS[type] || type;
}

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  return (
    <Badge variant="outline" className={`${config.className} font-medium text-xs border`}>
      {config.label}
    </Badge>
  );
}