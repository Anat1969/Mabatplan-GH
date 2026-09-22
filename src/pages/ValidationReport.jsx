import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, CheckCircle2, XCircle, AlertTriangle, FileCheck } from "lucide-react";
import CompletionBar from "../components/CompletionBar";
import { calculateCompletionScore, getMissingFields } from "../lib/mabatDefaults";

export default function ValidationReport() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [regulation, setRegulation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    setLoading(true);
    const projects = await base44.entities.Project.list();
    const proj = projects.find((p) => p.id === id);
    setProject(proj);

    if (proj) {
      const regs = await base44.entities.Regulation.filter({ project_id: id });
      if (regs.length > 0) setRegulation(regs[0]);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-20">
        <h2 className="text-lg font-semibold">תוכנית לא נמצאה</h2>
        <Link to="/">
          <Button variant="outline" className="mt-4">חזרה ללוח הבקרה</Button>
        </Link>
      </div>
    );
  }

  const completionScore = calculateCompletionScore(project, regulation);
  const missingFields = getMissingFields(project, regulation);
  const errors = missingFields.filter((f) => f.severity === "error");
  const warnings = missingFields.filter((f) => f.severity === "warning");
  const canExport = completionScore >= 80;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/project/${id}/edit`)}>
          <ArrowRight className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">דו״ח תקינות</h1>
          <p className="text-sm text-muted-foreground">
            תוכנית מס׳ {project.plan_number} — {project.plan_name}
          </p>
        </div>
      </div>

      {/* Score */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">אחוז השלמה כולל</h2>
          <div className={`flex items-center gap-2 text-sm font-medium ${canExport ? "text-emerald-600" : "text-amber-600"}`}>
            {canExport ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            {canExport ? "מוכן לייצוא" : "נדרשת השלמה"}
          </div>
        </div>
        <CompletionBar score={completionScore} />
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-emerald-600">
            {16 - missingFields.length}
          </div>
          <p className="text-xs text-muted-foreground mt-1">שדות תקינים</p>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-red-500">{errors.length}</div>
          <p className="text-xs text-muted-foreground mt-1">שגיאות</p>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-amber-500">{warnings.length}</div>
          <p className="text-xs text-muted-foreground mt-1">אזהרות</p>
        </Card>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <Card className="p-5">
          <h3 className="flex items-center gap-2 text-sm font-bold text-red-600 mb-3">
            <XCircle className="w-4 h-4" />
            שגיאות — שדות חובה חסרים ({errors.length})
          </h3>
          <div className="space-y-2">
            {errors.map((field, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span className="text-sm text-red-800 font-medium">{field.label}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <Card className="p-5">
          <h3 className="flex items-center gap-2 text-sm font-bold text-amber-600 mb-3">
            <AlertTriangle className="w-4 h-4" />
            אזהרות — שדות מומלצים חסרים ({warnings.length})
          </h3>
          <div className="space-y-2">
            {warnings.map((field, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="text-sm text-amber-800 font-medium">{field.label}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* All good */}
      {missingFields.length === 0 && (
        <Card className="p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <FileCheck className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-1">התוכנית הושלמה בהצלחה!</h3>
          <p className="text-sm text-muted-foreground">כל השדות הנדרשים מולאו. ניתן לייצא את המסמך.</p>
        </Card>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate(`/project/${id}/edit`)} className="gap-2">
          <ArrowRight className="w-4 h-4" />
          חזרה לעריכה
        </Button>
        {canExport && (
          <Button onClick={() => navigate(`/project/${id}/preview`)} className="gap-2">
            <FileCheck className="w-4 h-4" />
            תצוגה מקדימה וייצוא
          </Button>
        )}
      </div>
    </div>
  );
}