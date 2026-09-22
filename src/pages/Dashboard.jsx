import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  FilePlus, Search, FileText, FolderOpen, ClipboardList,
  Eye, CheckSquare, Send, RotateCcw, ClipboardCheck, Download,
  ListChecks, UserCheck, FileCheck, AlertCircle, Clock
} from "lucide-react";
import ProjectCard from "../components/ProjectCard";
import TrackFlow from "../components/TrackFlow";
import { calculateCompletionScore } from "../lib/mabatDefaults";

const REVIEW_STATUS_CONFIG = {
  pending: { label: "ממתין לבדיקה", color: "bg-gray-100 text-gray-700" },
  in_review: { label: "בבדיקה", color: "bg-blue-100 text-blue-700" },
  approved: { label: "אושר", color: "bg-green-100 text-green-700" },
  rejected: { label: "נדחה", color: "bg-red-100 text-red-700" },
  requires_changes: { label: "דרוש תיקון", color: "bg-amber-100 text-amber-700" },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [regulations, setRegulations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const me = await base44.auth.me().catch(() => null);
    setUser(me);
    const [projectsList, regsList] = await Promise.all([
      base44.entities.Project.list("-created_date"),
      base44.entities.Regulation.list(),
    ]);
    setProjects(projectsList);
    setRegulations(regsList);
    setLoading(false);
  }

  const getCompletionScore = (projectId) => {
    const reg = regulations.find((r) => r.project_id === projectId);
    const proj = projects.find((p) => p.id === projectId);
    return calculateCompletionScore(proj, reg);
  };

  const filtered = projects.filter(
    (p) => !search || p.plan_name?.includes(search) || p.plan_number?.includes(search) || p.block?.includes(search)
  );

  const isReviewer = user?.role === "reviewer";
  const isAdmin = user?.role === "admin";

  // Stats
  const reviewableProjects = projects.filter((p) => p.review_status);
  const pendingReview = projects.filter((p) => p.review_status === "pending" || p.review_status === "in_review").length;
  const approvedCount = projects.filter((p) => p.review_status === "approved").length;
  const requiresChanges = projects.filter((p) => p.review_status === "requires_changes").length;

  // Architect track steps (use last project if exists)
  const lastProject = projects[0];
  const architectSteps = [
    { Icon: FilePlus, label: "יצירת תוכנית", href: "/project/new", done: projects.length > 0 },
    { Icon: FileText, label: "מילוי פרטים ואשף", href: lastProject ? `/project/${lastProject.id}/edit` : "/project/new", done: lastProject && getCompletionScore(lastProject.id) > 50 },
    { Icon: Eye, label: "תצוגה מקדימה", href: lastProject ? `/project/${lastProject.id}/preview` : null, done: lastProject && getCompletionScore(lastProject.id) >= 80 },
    { Icon: CheckSquare, label: "דו״ח תקינות", href: lastProject ? `/project/${lastProject.id}/validation` : null, done: false },
    { Icon: Send, label: "הגשה לבדיקה", href: null, done: lastProject?.review_status != null },
    { Icon: RotateCcw, label: "מצב בדיקה", href: lastProject?.review_status ? `/project/${lastProject.id}/edit` : null, done: lastProject?.review_status === "approved" },
  ];

  // Reviewer track steps
  const firstPending = reviewableProjects.find(p => p.review_status === "pending" || p.review_status === "in_review");
  const reviewerSteps = [
    { Icon: ClipboardList, label: "לוח בוחנים", href: "/reviewer-dashboard", done: false },
    { Icon: FolderOpen, label: "בחירת תוכנית", href: "/reviewer-dashboard", done: false },
    { Icon: ListChecks, label: "רשימת תיוג", href: firstPending ? `/review/${firstPending.id}` : "/reviewer-dashboard", done: false },
    { Icon: UserCheck, label: "החלטת בוחן", href: firstPending ? `/review/${firstPending.id}` : "/reviewer-dashboard", done: false },
    { Icon: FileCheck, label: "שליחת החלטה", href: null, done: false },
    { Icon: Download, label: "ייצוא אישור PDF", href: null, done: false },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8" dir="rtl">

      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            שלום{user?.full_name ? `, ${user.full_name}` : ""} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isReviewer ? "מערכת בדיקת הוראות תוכנית — אגף תכנון" : "מערכת הוראות תוכנית לפי תקני מב״ת"}
          </p>
        </div>
        {!isReviewer && (
          <Link to="/project/new">
            <Button className="gap-2 shadow-md shadow-primary/20">
              <FilePlus className="w-4 h-4" />
              תוכנית חדשה
            </Button>
          </Link>
        )}
        {isReviewer && (
          <Link to="/reviewer-dashboard">
            <Button className="gap-2 shadow-md shadow-primary/20">
              <ClipboardList className="w-4 h-4" />
              לוח בוחנים
            </Button>
          </Link>
        )}
      </div>

      {/* === TRACKS === */}
      {/* Show architect track to architects + admin */}
      {!isReviewer && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-5 rounded-full bg-primary" />
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">מסלול אדריכל / מגיש</h2>
            </div>
            <Link to="/architect" className="text-xs text-primary hover:underline font-medium">כניסה למסלול המלא ←</Link>
          </div>
          <TrackFlow
            title="מסלול הגשת תוכנית"
            subtitle="מיצירת תוכנית חדשה ועד הגשתה לבדיקה ואישורה"
            color={{ border: "border-primary/30", bg: "bg-primary/10", text: "text-primary", iconText: "text-primary" }}
            steps={architectSteps}
          />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <QuickAction href="/project/new" Icon={FilePlus} label="תוכנית חדשה" desc="התחל מסלול חדש" colorClass="text-primary" />
            {lastProject && <QuickAction href={`/project/${lastProject.id}/edit`} Icon={FileText} label="המשך עריכה" desc={lastProject.plan_name} colorClass="text-blue-600" />}
            {lastProject && getCompletionScore(lastProject.id) >= 80 && <QuickAction href={`/project/${lastProject.id}/preview`} Icon={Eye} label="תצוגה מקדימה" desc="צפה במסמך" colorClass="text-violet-600" />}
            {lastProject && <QuickAction href={`/project/${lastProject.id}/validation`} Icon={CheckSquare} label="דו״ח תקינות" desc="בדוק שלמות" colorClass="text-emerald-600" />}
          </div>
        </div>
      )}

      {/* Show reviewer track to reviewers + admin */}
      {(isReviewer || isAdmin) && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-5 rounded-full bg-amber-500" />
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">מסלול בוחן — אגף תכנון</h2>
            </div>
            <Link to="/reviewer" className="text-xs text-amber-600 hover:underline font-medium">כניסה למסלול המלא ←</Link>
          </div>
          <TrackFlow
            title="מסלול בדיקת תוכנית"
            subtitle="ממסך הבוחנים עד החלטה סופית וייצוא אישור"
            color={{ border: "border-amber-400/40", bg: "bg-amber-50", text: "text-amber-700", iconText: "text-amber-600" }}
            steps={reviewerSteps}
          />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard value={reviewableProjects.length} label="סה״כ הוגשו" Icon={FileText} color="text-primary" />
            <StatCard value={pendingReview} label="ממתינות לבדיקה" Icon={Clock} color="text-blue-600" />
            <StatCard value={approvedCount} label="אושרו" Icon={CheckSquare} color="text-emerald-600" />
            <StatCard value={requiresChanges} label="דרושים תיקונים" Icon={AlertCircle} color="text-amber-600" />
          </div>
          {pendingReview > 0 && (
            <Card className="overflow-hidden">
              <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold text-sm">תוכניות ממתינות לבדיקה</h3>
                <Link to="/reviewer" className="text-xs text-primary hover:underline">כל התוכניות ←</Link>
              </div>
              <div className="divide-y divide-border">
                {projects.filter(p => p.review_status === "pending" || p.review_status === "in_review").slice(0, 5).map((p) => {
                  const conf = REVIEW_STATUS_CONFIG[p.review_status];
                  return (
                    <div key={p.id} className="flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{p.plan_name}</p>
                          <p className="text-xs text-muted-foreground">מס׳ {p.plan_number} | סבב {p.review_round || 1}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${conf?.color}`}>{conf?.label}</span>
                        <Link to={`/review/${p.id}`}>
                          <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7">פתח לבדיקה</Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* === Projects list (for architects/admin) === */}
      {!isReviewer && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-5 rounded-full bg-slate-400" />
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">התוכניות שלי</h2>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard value={projects.length} label="סה״כ תוכניות" Icon={FileText} color="text-primary" />
            <StatCard value={projects.filter(p => p.status === "draft").length} label="טיוטות" Icon={FolderOpen} color="text-slate-500" />
            <StatCard value={projects.filter(p => p.status === "in_progress").length} label="בעבודה" Icon={FileText} color="text-blue-600" />
            <StatCard value={projects.filter(p => p.review_status === "approved").length} label="אושרו" Icon={CheckSquare} color="text-emerald-600" />
          </div>

          <div className="relative max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="חיפוש לפי שם, מספר, גוש..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10" />
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                <FolderOpen className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">{search ? "לא נמצאו תוצאות" : "אין תוכניות עדיין"}</h3>
              <p className="text-sm text-muted-foreground mb-4">{search ? "נסו לשנות את מילות החיפוש" : "צרו את התוכנית הראשונה שלכם"}</p>
              {!search && (
                <Link to="/project/new">
                  <Button variant="outline" className="gap-2"><FilePlus className="w-4 h-4" />תוכנית חדשה</Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((project) => (
                <ProjectCard key={project.id} project={project} completionScore={getCompletionScore(project.id)} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ value, label, Icon, color }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
      <div className={color}><Icon className="w-5 h-5" /></div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function QuickAction({ href, Icon, label, desc, colorClass }) {
  return (
    <Link to={href}>
      <div className="bg-card border border-border rounded-xl p-4 hover:border-primary/40 hover:bg-muted/30 transition-all cursor-pointer group">
        <div className={`${colorClass} mb-2`}><Icon className="w-5 h-5" /></div>
        <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">{desc}</p>
      </div>
    </Link>
  );
}