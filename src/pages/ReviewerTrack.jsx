import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ClipboardList, FolderOpen, ListChecks, UserCheck,
  FileCheck, Download, Clock, CheckCircle2, XCircle,
  AlertTriangle, ChevronLeft, Eye, ArrowLeft
} from "lucide-react";

const REVIEW_STATUS_CONFIG = {
  pending: { label: "ממתין לבדיקה", color: "bg-gray-100 text-gray-700", Icon: Clock },
  in_review: { label: "בבדיקה", color: "bg-blue-100 text-blue-700", Icon: Eye },
  approved: { label: "אושר", color: "bg-green-100 text-green-700", Icon: CheckCircle2 },
  rejected: { label: "נדחה", color: "bg-red-100 text-red-700", Icon: XCircle },
  requires_changes: { label: "דרוש תיקון", color: "bg-amber-100 text-amber-700", Icon: AlertTriangle },
};

function FlowStep({ Icon, label, desc, href, active }) {
  const inner = (
    <div className="flex flex-col items-center text-center gap-2 group cursor-pointer">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow transition-all
        ${active ? "bg-amber-500 text-white shadow-lg shadow-amber-500/30 scale-105" : "bg-amber-50 text-amber-600 group-hover:bg-amber-100"}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className={`text-xs font-semibold leading-tight ${active ? "text-amber-700" : "text-foreground"}`}>{label}</p>
        {desc && <p className="text-[10px] text-muted-foreground mt-0.5 max-w-[80px] leading-tight">{desc}</p>}
      </div>
      {active && <span className="text-[10px] text-amber-600 font-medium animate-pulse">← כאן עכשיו</span>}
    </div>
  );
  if (href) return <Link to={href}>{inner}</Link>;
  return inner;
}

export default function ReviewerTrack() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const me = await base44.auth.me().catch(() => null);
    setUser(me);
    const all = await base44.entities.Project.list("-created_date");
    const reviewable = all.filter(p => p.review_status);
    setProjects(reviewable);
    setLoading(false);
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-amber-400/30 border-t-amber-500 rounded-full animate-spin" />
    </div>
  );

  if (user && user.role !== "reviewer" && user.role !== "admin") {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground font-medium">אין לך הרשאה לגשת לדף זה.</p>
        <Link to="/"><Button variant="outline" className="mt-4">חזרה לדשבורד</Button></Link>
      </div>
    );
  }

  const byStatus = (s) => projects.filter(p => p.review_status === s);
  const pending = byStatus("pending");
  const inReview = byStatus("in_review");
  const requiresChanges = byStatus("requires_changes");
  const approved = byStatus("approved");
  const rejected = byStatus("rejected");

  const firstActive = [...pending, ...inReview][0];

  const STEPS = [
    { Icon: ClipboardList, label: "לוח בוחנים", desc: "כל התוכניות", href: "/reviewer-dashboard" },
    { Icon: FolderOpen, label: "בחירת תוכנית", desc: "פתיחת תיק", href: "/reviewer-dashboard" },
    { Icon: ListChecks, label: "רשימת תיוג", desc: "בדיקת B1–B8", href: firstActive ? `/review/${firstActive.id}` : "/reviewer-dashboard" },
    { Icon: UserCheck, label: "החלטת בוחן", desc: "אישור / דחייה", href: firstActive ? `/review/${firstActive.id}` : null },
    { Icon: FileCheck, label: "שליחת החלטה", desc: "עדכון סטטוס", href: null },
    { Icon: Download, label: "ייצוא PDF", desc: "אישור רשמי", href: null },
  ];

  const activeStepIdx = firstActive ? 2 : 0;

  return (
    <div className="space-y-8 max-w-5xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/"><Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button></Link>
          <div>
            <h1 className="text-2xl font-bold">מסלול בוחן — אגף תכנון</h1>
            <p className="text-sm text-muted-foreground mt-0.5">בדיקת הוראות תוכנית לפי תקני מב״ת</p>
          </div>
        </div>
        <Link to="/reviewer-dashboard">
          <Button className="gap-2 bg-amber-500 hover:bg-amber-600 shadow-md shadow-amber-500/20 text-white">
            <ClipboardList className="w-4 h-4" />
            לוח בוחנים
          </Button>
        </Link>
      </div>

      {/* Flow diagram */}
      <Card className="p-6 sm:p-8 bg-gradient-to-bl from-amber-50 to-transparent border-amber-200">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-6">זרימת בדיקה — מקצה לקצה</h2>
        <div className="flex items-start justify-between gap-2 overflow-x-auto pb-2">
          {STEPS.map((step, idx) => (
            <div key={idx} className="flex items-center shrink-0">
              <FlowStep {...step} active={idx === activeStepIdx} />
              {idx < STEPS.length - 1 && (
                <ChevronLeft className="w-5 h-5 text-muted-foreground/30 mx-1 mb-8 shrink-0" />
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "ממתינות", count: pending.length, color: "text-gray-600", bg: "bg-gray-50 border-gray-200" },
          { label: "בבדיקה", count: inReview.length, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
          { label: "דרוש תיקון", count: requiresChanges.length, color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
          { label: "אושרו", count: approved.length, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
          { label: "נדחו", count: rejected.length, color: "text-red-600", bg: "bg-red-50 border-red-200" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border p-4 ${s.bg} flex flex-col items-center`}>
            <p className={`text-3xl font-bold ${s.color}`}>{s.count}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Grouped project tables */}
      {[
        { title: "ממתינות לבדיקה", items: [...pending, ...inReview], urgent: true },
        { title: "דרושים תיקונים", items: requiresChanges },
        { title: "אושרו", items: approved },
        { title: "נדחו", items: rejected },
      ].filter(g => g.items.length > 0).map((group) => (
        <div key={group.title} className="space-y-2">
          <div className="flex items-center gap-2">
            {group.urgent && <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />}
            <h3 className="font-semibold text-sm">{group.title} ({group.items.length})</h3>
          </div>
          <Card className="overflow-hidden">
            <div className="divide-y divide-border">
              {group.items.map((p) => {
                const conf = REVIEW_STATUS_CONFIG[p.review_status];
                const StatusIcon = conf?.Icon || Clock;
                const date = p.submitted_at
                  ? new Date(p.submitted_at).toLocaleDateString("he-IL")
                  : p.submission_date || "—";
                return (
                  <div key={p.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${conf?.color}`}>
                        <StatusIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{p.plan_name}</p>
                        <p className="text-xs text-muted-foreground">
                          מס׳ {p.plan_number} · {p.submitted_by || "—"} · {date} · סבב {p.review_round || 1}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 mr-3">
                      <span className={`hidden sm:inline text-xs px-2.5 py-1 rounded-full font-medium ${conf?.color}`}>
                        {conf?.label}
                      </span>
                      <Link to={`/review/${p.id}`}>
                        <Button size="sm" className="gap-1.5 bg-amber-500 hover:bg-amber-600 text-white h-8 text-xs">
                          <Eye className="w-3.5 h-3.5" />
                          פתח
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      ))}

      {projects.length === 0 && (
        <div className="text-center py-16">
          <ClipboardList className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
          <p className="font-medium">אין תוכניות שהוגשו לבדיקה</p>
          <p className="text-sm text-muted-foreground mt-1">תוכניות שיוגשו על ידי אדריכלים יופיעו כאן</p>
        </div>
      )}
    </div>
  );
}