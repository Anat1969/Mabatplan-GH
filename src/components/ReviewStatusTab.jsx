import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { RotateCcw, Clock, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const STATUS_CONFIG = {
  pending: { label: "ממתין לבדיקה", Icon: Clock, color: "bg-gray-100 text-gray-700" },
  in_review: { label: "בבדיקה", Icon: Clock, color: "bg-blue-100 text-blue-700" },
  approved: { label: "אושר", Icon: CheckCircle2, color: "bg-green-100 text-green-700" },
  rejected: { label: "נדחה", Icon: XCircle, color: "bg-red-100 text-red-700" },
  requires_changes: { label: "דרוש תיקון", Icon: AlertTriangle, color: "bg-amber-100 text-amber-700" },
};

export default function ReviewStatusTab({ project, onResubmit }) {
  const [decision, setDecision] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resubmitting, setResubmitting] = useState(false);

  useEffect(() => {
    load();
  }, [project?.id, project?.review_round]);

  async function load() {
    if (!project?.id) return;
    setLoading(true);
    const decisions = await base44.entities.ReviewDecision.filter({ project_id: project.id });
    const round = project.review_round || 1;
    const roundDecision = decisions.find((d) => d.round === round);
    setDecision(roundDecision || null);
    setLoading(false);
  }

  async function handleResubmit() {
    setResubmitting(true);
    const newRound = (project.review_round || 1) + 1;
    await base44.entities.Project.update(project.id, {
      review_round: newRound,
      review_status: "pending",
      submitted_at: new Date().toISOString(),
    });
    toast.success("התוכנית הוגשה מחדש לבדיקה");
    setResubmitting(false);
    onResubmit({ ...project, review_round: newRound, review_status: "pending" });
  }

  const statusConf = STATUS_CONFIG[project?.review_status] || null;
  const round = project?.review_round || 1;

  if (!project?.review_status) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        <Clock className="w-8 h-8 mx-auto mb-3 opacity-30" />
        <p className="text-sm font-medium">התוכנית טרם הוגשה לבדיקה</p>
        <p className="text-xs mt-1">לאחר הגשה לבדיקה, פרטי הסטטוס יופיעו כאן</p>
      </div>
    );
  }

  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex items-center gap-3 flex-wrap">
        {statusConf && (
          <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${statusConf.color}`}>
            <statusConf.Icon className="w-4 h-4" />
            {statusConf.label}
          </span>
        )}
        <span className="text-sm text-muted-foreground">סבב בדיקה {round}</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : decision ? (
        <div className="bg-card border rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-sm border-b pb-2">החלטת הבוחן</h3>

          {decision.decision_reason && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">הערות כלליות</p>
              <p className="text-sm whitespace-pre-wrap">{decision.decision_reason}</p>
            </div>
          )}

          {decision.required_corrections && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-1">
              <p className="text-xs font-semibold text-amber-800">תיקונים נדרשים</p>
              <p className="text-sm text-amber-900 whitespace-pre-wrap">{decision.required_corrections}</p>
            </div>
          )}

          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
            {decision.signature_name && <span>בוחן: {decision.signature_name}</span>}
            {decision.decision_date && (
              <span>תאריך: {new Date(decision.decision_date).toLocaleDateString("he-IL")}</span>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Clock className="w-6 h-6 mx-auto mb-2 opacity-30" />
          <p className="text-sm">ממתין להחלטת הבוחן...</p>
        </div>
      )}

      {project?.review_status === "requires_changes" && (
        <Button onClick={handleResubmit} disabled={resubmitting} className="gap-2">
          <RotateCcw className="w-4 h-4" />
          {resubmitting ? "מגיש..." : "הגש מחדש לאחר תיקון"}
        </Button>
      )}
    </div>
  );
}