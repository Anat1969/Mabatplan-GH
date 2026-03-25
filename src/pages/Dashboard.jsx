import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FilePlus, Search, FileText, FolderOpen } from "lucide-react";
import ProjectCard from "../components/ProjectCard";
import { calculateCompletionScore } from "../lib/mabatDefaults";

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [regulations, setRegulations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
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
    (p) =>
      !search ||
      p.plan_name?.includes(search) ||
      p.plan_number?.includes(search) ||
      p.block?.includes(search) ||
      p.parcel?.includes(search)
  );

  const stats = {
    total: projects.length,
    draft: projects.filter((p) => p.status === "draft").length,
    inProgress: projects.filter((p) => p.status === "in_progress").length,
    approved: projects.filter((p) => p.status === "approved").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">לוח בקרה</h1>
          <p className="text-sm text-muted-foreground mt-1">ניהול הוראות תוכנית לפי תקני מנהל התכנון</p>
        </div>
        <Link to="/project/new">
          <Button className="gap-2 shadow-md shadow-primary/20">
            <FilePlus className="w-4 h-4" />
            תוכנית חדשה
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "סה״כ תוכניות", value: stats.total, icon: FileText, color: "text-primary" },
          { label: "טיוטות", value: stats.draft, icon: FolderOpen, color: "text-slate-500" },
          { label: "בעבודה", value: stats.inProgress, icon: FileText, color: "text-blue-600" },
          { label: "אושרו", value: stats.approved, icon: FileText, color: "text-emerald-600" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-card border border-border rounded-xl p-4 flex items-center gap-3"
          >
            <div className={`${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="חיפוש לפי שם, מספר, גוש או חלקה..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-10"
        />
      </div>

      {/* Project List */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">
            {search ? "לא נמצאו תוצאות" : "אין תוכניות עדיין"}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {search ? "נסו לשנות את מילות החיפוש" : "צרו את התוכנית הראשונה שלכם"}
          </p>
          {!search && (
            <Link to="/project/new">
              <Button variant="outline" className="gap-2">
                <FilePlus className="w-4 h-4" />
                תוכנית חדשה
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              completionScore={getCompletionScore(project.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}