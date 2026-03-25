import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ClipboardList, Eye } from "lucide-react";

const REVIEW_STATUS_CONFIG = {
  pending: { label: "ממתין לבדיקה", color: "bg-gray-100 text-gray-700" },
  in_review: { label: "בבדיקה", color: "bg-blue-100 text-blue-700" },
  approved: { label: "אושר", color: "bg-green-100 text-green-700" },
  rejected: { label: "נדחה", color: "bg-red-100 text-red-700" },
  requires_changes: { label: "דרוש תיקון", color: "bg-amber-100 text-amber-700" },
};

export default function ReviewerDashboard() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function load() {
      const me = await base44.auth.me();
      setUser(me);
      const all = await base44.entities.Project.list();
      const reviewable = all.filter((p) => p.review_status || p.status === "pending_review");
      setProjects(reviewable);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (user?.role !== "reviewer" && user?.role !== "admin") {
    return (
      <div className="text-center py-20">
        <ClipboardList className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
        <p className="text-muted-foreground font-medium">אין לך הרשאה לגשת לדף זה.</p>
        <Link to="/"><Button variant="outline" className="mt-4">חזרה לדשבורד</Button></Link>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">לוח בוחנים</h1>
        <p className="text-sm text-muted-foreground mt-1">תוכניות ממתינות לבדיקה — אגף תכנון</p>
      </div>

      <Card className="overflow-hidden">
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ClipboardList className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="font-medium text-foreground">אין תוכניות ממתינות לבדיקה</p>
            <p className="text-sm text-muted-foreground mt-1">תוכניות שיוגשו לבדיקה יופיעו כאן</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">מספר תוכנית</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">שם תוכנית</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">מגיש</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">תאריך הגשה</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">סבב</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">סטטוס בדיקה</th>
                  <th className="py-3 px-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {projects.map((p) => {
                  const conf = REVIEW_STATUS_CONFIG[p.review_status] || REVIEW_STATUS_CONFIG.pending;
                  const date = p.submitted_at
                    ? new Date(p.submitted_at).toLocaleDateString("he-IL")
                    : p.submission_date || "—";
                  return (
                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-primary">{p.plan_number}</td>
                      <td className="py-3 px-4 font-medium">{p.plan_name}</td>
                      <td className="py-3 px-4 text-muted-foreground">{p.submitted_by || "—"}</td>
                      <td className="py-3 px-4 text-muted-foreground">{date}</td>
                      <td className="py-3 px-4 text-muted-foreground">{p.review_round || 1}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${conf.color}`}>
                          {conf.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Link to={`/review/${p.id}`}>
                          <Button size="sm" className="gap-1.5">
                            <Eye className="w-3.5 h-3.5" />
                            פתח לבדיקה
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}