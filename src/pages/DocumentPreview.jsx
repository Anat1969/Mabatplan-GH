import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Download, FileCheck, AlertTriangle } from "lucide-react";
import { getPlanTypeLabel } from "../components/StatusBadge";
import { ZONE_DEFAULTS, calculateCompletionScore } from "../lib/mabatDefaults";
import CompletionBar from "../components/CompletionBar";

export default function DocumentPreview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [regulation, setRegulation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

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

  const completionScore = calculateCompletionScore(project, regulation);
  const canExport = completionScore >= 80;

  async function handleExport() {
    if (!canExport) return;
    setExporting(true);

    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    // Since jsPDF doesn't support Hebrew natively well, we'll create a simple structured document
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(`Regulations No. ${project.plan_number || ""} - ${project.plan_name || ""}`, 105, 20, { align: "center" });

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    let y = 40;

    const addLine = (label, value) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.setFont("helvetica", "bold");
      doc.text(`${label}:`, 190, y, { align: "right" });
      doc.setFont("helvetica", "normal");
      doc.text(String(value || "-"), 140, y, { align: "right" });
      y += 8;
    };

    const addSection = (title) => {
      if (y > 260) { doc.addPage(); y = 20; }
      y += 4;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(title, 190, y, { align: "right" });
      doc.setFontSize(12);
      y += 10;
    };

    addSection("A. Identifying Details");
    addLine("Plan Name", project.plan_name);
    addLine("Plan Number", project.plan_number);
    addLine("Block (Gush)", project.block);
    addLine("Parcel (Chelka)", project.parcel);
    addLine("Plan Type", getPlanTypeLabel(project.plan_type));

    addSection("B. Land Use");
    (regulation?.land_use || []).forEach((zone) => {
      addLine(zone.description, `${zone.area_sqm} sqm (${zone.percentage}%)`);
    });

    addSection("C. Building Rights");
    addLine("Building Rights %", regulation?.building_rights_percent);
    addLine("Max Floors", regulation?.max_floors);
    addLine("Max Height (m)", regulation?.max_height);
    addLine("Front Setback (m)", regulation?.front_setback);
    addLine("Side Setback (m)", regulation?.side_setback);
    addLine("Rear Setback (m)", regulation?.rear_setback);
    addLine("Parking Ratio", regulation?.parking_ratio);
    addLine("Green Area %", regulation?.green_area_percent);

    if (regulation?.special_instructions) {
      addSection("D. Special Instructions");
      const lines = doc.splitTextToSize(regulation.special_instructions, 170);
      lines.forEach((line) => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(line, 190, y, { align: "right" });
        y += 6;
      });
    }

    addSection("E. Attachments");
    (regulation?.attachments || []).filter((a) => a.included).forEach((att) => {
      addLine(att.name, att.required ? "Required - Included" : "Optional - Included");
    });

    doc.save(`plan_regulations_${project.plan_number || "draft"}.pdf`);
    setExporting(false);
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/project/${id}/edit`)}>
            <ArrowRight className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">תצוגה מקדימה</h1>
            <p className="text-sm text-muted-foreground">הוראות תוכנית מס׳ {project.plan_number}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link to={`/project/${id}/validation`}>
            <Button variant="outline" className="gap-2">
              <FileCheck className="w-4 h-4" />
              דו״ח תקינות
            </Button>
          </Link>
          <Button
            onClick={handleExport}
            disabled={!canExport || exporting}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            {exporting ? "מייצא..." : "ייצוא PDF"}
          </Button>
        </div>
      </div>

      {!canExport && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">לא ניתן לייצא את המסמך</p>
            <p className="text-sm text-amber-700 mt-1">
              אחוז ההשלמה חייב להגיע ל-80% לפחות כדי לייצא. כרגע: {completionScore}%
            </p>
            <div className="mt-2 max-w-xs">
              <CompletionBar score={completionScore} />
            </div>
          </div>
        </div>
      )}

      {/* Document Preview */}
      <Card className="bg-white border-2 border-border shadow-lg overflow-hidden">
        <div className="p-8 sm:p-12 space-y-8">
          {/* Title */}
          <div className="text-center border-b-2 border-foreground pb-6">
            <h1 className="text-2xl font-bold text-foreground">הוראות תוכנית מס׳ {project.plan_number}</h1>
            <p className="text-lg text-muted-foreground mt-2">{project.plan_name}</p>
          </div>

          {/* Section 1: Details */}
          <Section title="א. פרטים מזהים">
            <InfoRow label="שם התוכנית" value={project.plan_name} />
            <InfoRow label="מספר תוכנית" value={project.plan_number} />
            <InfoRow label="גוש" value={project.block} />
            <InfoRow label="חלקה" value={project.parcel} />
            <InfoRow label="סוג תוכנית" value={getPlanTypeLabel(project.plan_type)} />
          </Section>

          {/* Section 2: Land Use */}
          <Section title="ב. ייעודי קרקע">
            {regulation?.land_use?.length > 0 ? (
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-right py-2 font-semibold">ייעוד</th>
                    <th className="text-right py-2 font-semibold">שטח (מ״ר)</th>
                    <th className="text-right py-2 font-semibold">אחוז</th>
                  </tr>
                </thead>
                <tbody>
                  {regulation.land_use.map((zone, idx) => (
                    <tr key={idx} className="border-b border-border/50">
                      <td className="py-2">{zone.description}</td>
                      <td className="py-2">{zone.area_sqm || "—"}</td>
                      <td className="py-2">{zone.percentage ? `${zone.percentage}%` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-muted-foreground text-sm">לא הוגדרו ייעודי קרקע</p>
            )}
          </Section>

          {/* Section 3: Building Rights */}
          <Section title="ג. זכויות בנייה">
            <InfoRow label="אחוזי בנייה" value={regulation?.building_rights_percent ? `${regulation.building_rights_percent}%` : null} />
            <InfoRow label="מספר קומות מרבי" value={regulation?.max_floors} />
            <InfoRow label="גובה מרבי" value={regulation?.max_height ? `${regulation.max_height} מטר` : null} />
            <InfoRow label="קו בניין קדמי" value={regulation?.front_setback != null ? `${regulation.front_setback} מטר` : null} />
            <InfoRow label="קו בניין צידי" value={regulation?.side_setback != null ? `${regulation.side_setback} מטר` : null} />
            <InfoRow label="קו בניין אחורי" value={regulation?.rear_setback != null ? `${regulation.rear_setback} מטר` : null} />
            <InfoRow label="יחס חניה" value={regulation?.parking_ratio != null ? `${regulation.parking_ratio} לדירה` : null} />
            <InfoRow label="שטח ירוק" value={regulation?.green_area_percent != null ? `${regulation.green_area_percent}%` : null} />
          </Section>

          {/* Section 4: Special Instructions */}
          <Section title="ד. הוראות מיוחדות">
            {regulation?.special_instructions ? (
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {regulation.special_instructions}
              </p>
            ) : (
              <p className="text-muted-foreground text-sm">לא הוגדרו הוראות מיוחדות</p>
            )}
          </Section>

          {/* Section 5: Attachments */}
          <Section title="ה. נספחים">
            {regulation?.attachments?.some((a) => a.included) ? (
              <ul className="space-y-1">
                {regulation.attachments
                  .filter((a) => a.included)
                  .map((att, idx) => (
                    <li key={idx} className="text-sm flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      {att.name}
                      {att.required && <span className="text-xs text-muted-foreground">(חובה)</span>}
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-sm">לא צוינו נספחים</p>
            )}
          </Section>
        </div>
      </Card>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h2 className="text-base font-bold text-foreground mb-3 pb-1 border-b border-border">{title}</h2>
      <div>{children}</div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value || "—"}</span>
    </div>
  );
}