import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  FilePlus, FileText, Eye, CheckSquare, Send, RotateCcw,
  Search, FolderOpen, ChevronLeft, ChevronRight, ArrowLeft
} from "lucide-react";
import ProjectCard from "../components/ProjectCard";
import CompletionBar from "../components/CompletionBar";
import { calculateCompletionScore } from "../lib/mabatDefaults";

const REVIEW_STATUS = {
  pending: { label: "ממתין לבדיקה", color: "bg-gray-100 text-gray-700" },
  in_review: { label: "בבדיקה", color: "bg-blue-100 text-blue-700" },
  approved: { label: "אושר", color: "bg-green-100 text-green-700" },
  rejected: { label: "נדחה", color: "bg-red-100 text-red-700" },
  requires_changes: { label: "דרוש תיקון", color: "bg-amber-100 text-amber-700" },
};

function FlowStep({ num, Icon, label, desc, href, done, active, disabled }) {
  const inner = (
    <div className={`flex flex-col items-center text-center gap-2 group cursor-pointer transition-all ${disabled ? "opacity-40 pointer-events-none" : ""}`}>
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold shadow transition-all
        ${done ? "bg-emerald-500 text-white" : active ? "bg-primary text-white shadow-lg shadow-primary/30 scale-105" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className={`text-xs font-semibold leading-tight ${active ? "text-primary" : "text-foreground"}`}>{label}</p>
        {desc && <p className="text-[10px] text-muted-foreground mt-0.5 max-w-[80px] leading-tight">{desc}</p>}
      </div>
      {done && <span className="text-[10px] text-emerald-600 font-medium">✓ הושלם</span>}
      {active && <span className="text-[10px] text-primary font-medium animate-pulse">← השלב הנוכחי</span>}
    </div>
  );
  if (href && !disabled) return <Link to={href}>{inner}</Link>;
  return inner;
}

export default function ArchitectTrack() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [regulations, setRegulations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const [pl, rl] = await Promise.all([
      api.entities.Project.list("-created_date"),
      api.entities.Regulation.list(),
    ]);
    setProjects(pl);
    setRegulations(rl);
    setLoading(false);
  }

  const getScore = (pid) => {
    const reg = regulations.find(r => r.project_id === pid);
    const proj = projects.find(p => p.id === pid);
    return calculateCompletionScore(proj, reg);
  };

  const filtered = projects.filter(p =>
    !search || p.plan_name?.includes(search) || p.plan_number?.includes(search) || p.block?.includes(search)
  );

  // Determine active flow step for latest project
  const latest = projects[0];
  const latestScore = latest ? getScore(latest.id) : 0;
  const activeStep = !latest ? 0
    : latest.review_status === "approved" ? 5
    : latest.review_status ? 4
    : latestScore >= 80 ? 2
    : latestScore > 0 ? 1
    : 0;

  const STEPS = [
    { Icon: FilePlus, label: "יצירת תוכנית", desc: "פתיחת תיק חדש", href: "/project/new", done: projects.length > 0 },
    { Icon: FileText, label: "מילוי פרטים", desc: "אשף 5 שלבים", href: latest ? `/project/${latest.id}/edit` : null, done: latestScore >= 50 },
    { Icon: Eye, label: "תצוגה מקדימה", desc: "בדיקת המסמך", href: latest && latestScore >= 80 ? `/project/${latest.id}/preview` : null, done: latestScore >= 80, disabled: latestScore < 80 },
    { Icon: CheckSquare, label: "דו״ח תקינות", desc: "בדיקת שלמות", href: latest ? `/project/${latest.id}/validation` : null, done: false, disabled: !latest },
    { Icon: Send, label: "הגשה לבדיקה", desc: "שליחה לאגף", href: latest && latestScore >= 80 ? `/project/${latest.id}/edit` : null, done: latest?.review_status != null, disabled: !latest || latestScore < 80 },
    { Icon: RotateCcw, label: "מצב בדיקה", desc: "מעקב ותיקון", href: latest?.review_status ? `/project/${latest.id}/edit` : null, done: latest?.review_status === "approved", disabled: !latest?.review_status },
  ];

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8 max-w-5xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/"><Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button></Link>
          <div>
            <h1 className="text-2xl font-bold">מסלול אדריכל / מגיש</h1>
            <p className="text-sm text-muted-foreground mt-0.5">הגשת הוראות תוכנית לפי תקני מב״ת</p>
          </div>
        </div>
        <Button onClick={() => navigate("/project/new")} className="gap-2 shadow-md shadow-primary/20">
          <FilePlus className="w-4 h-4" />
          תוכנית חדשה
        </Button>
      </div>

      {/* Flow diagram */}
      <Card className="p-6 sm:p-8 bg-gradient-to-bl from-primary/5 to-transparent border-primary/20">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-6">זרימת עבודה — מקצה לקצה</h2>
        <div className="flex items-start justify-between gap-2 overflow-x-auto pb-2">
          {STEPS.map((step, idx) => (
            <div key={idx} className="flex items-center shrink-0">
              <FlowStep {...step} num={idx + 1} active={idx === activeStep} />
              {idx < STEPS.length - 1 && (
                <ChevronLeft className="w-5 h-5 text-muted-foreground/30 mx-1 mb-8 shrink-0" />
              )}
            </div>
          ))}
        </div>
        {latest && (
          <div className="mt-6 pt-5 border-t border-border/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">אחוז השלמה — {latest.plan_name}</span>
              {latest.review_status && (
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${REVIEW_STATUS[latest.review_status]?.color}`}>
                  {REVIEW_STATUS[latest.review_status]?.label}
                </span>
              )}
            </div>
            <CompletionBar score={latestScore} />
          </div>
        )}
      </Card>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { href: "/project/new", Icon: FilePlus, label: "תוכנית חדשה", desc: "פתח תיק חדש", color: "text-primary" },
          latest && { href: `/project/${latest.id}/edit`, Icon: FileText, label: "המשך עריכה", desc: latest.plan_name || "תוכנית אחרונה", color: "text-blue-600" },
          latest && latestScore >= 80 && { href: `/project/${latest.id}/preview`, Icon: Eye, label: "תצוגה מקדימה", desc: "צפה במסמך הסופי", color: "text-violet-600" },
          latest && { href: `/project/${latest.id}/validation`, Icon: CheckSquare, label: "דו״ח תקינות", desc: "בדוק שלמות", color: "text-emerald-600" },
          latest?.review_status && { href: `/project/${latest.id}/edit`, Icon: RotateCcw, label: "מצב בדיקה", desc: REVIEW_STATUS[latest.review_status]?.label, color: "text-amber-600" },
        ].filter(Boolean).map((action, i) => (
          <Link key={i} to={action.href}>
            <div className="bg-card border border-border rounded-xl p-4 hover:border-primary/40 hover:shadow-sm transition-all group cursor-pointer h-full">
              <div className={`${action.color} mb-2`}><action.Icon className="w-5 h-5" /></div>
              <p className="text-sm font-semibold group-hover:text-primary transition-colors">{action.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{action.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Projects list */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold">התוכניות שלי ({projects.length})</h2>
          <div className="relative w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="חיפוש..." value={search} onChange={e => setSearch(e.target.value)} className="pr-10 h-8 text-sm" />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="font-medium">{search ? "לא נמצאו תוצאות" : "אין תוכניות עדיין"}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {search ? "נסו לשנות את מילות החיפוש" : "לחצו על 'תוכנית חדשה' להתחלה"}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(p => <ProjectCard key={p.id} project={p} completionScore={getScore(p.id)} />)}
          </div>
        )}
      </div>
    </div>
  );
}