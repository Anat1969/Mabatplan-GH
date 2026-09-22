import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "@/api/client";
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
  const documentRef = useRef(null);

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    setLoading(true);
    const projects = await api.entities.Project.list();
    const proj = projects.find((p) => p.id === id);
    setProject(proj);

    if (proj) {
      const regs = await api.entities.Regulation.filter({ project_id: id });
      if (regs.length > 0) setRegulation(regs[0]);
    }
    setLoading(false);
  }

  const completionScore = calculateCompletionScore(project, regulation);
  const canExport = completionScore >= 80;

  async function handleExport() {
    if (!canExport) return;
    setExporting(true);

    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");

    const element = documentRef.current;
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    pdf.save(`הוראות_תוכנית_${project.plan_number || "טיוטא"}.pdf`);
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
        <div ref={documentRef} className="p-10 sm:p-14 space-y-10 bg-white" dir="rtl" style={{ fontFamily: "'Heebo', sans-serif" }}>

          {/* Official Header */}
          <div className="text-center pb-8 border-b-4 border-slate-800">
            <p className="text-xs font-semibold tracking-widest text-slate-500 uppercase mb-2">מדינת ישראל — מינהל התכנון</p>
            <h1 className="text-3xl font-extrabold text-slate-900 leading-tight">
              הוראות תוכנית מס׳ {project.plan_number || "___"}
            </h1>
            <h2 className="text-xl font-semibold text-slate-700 mt-2">{project.plan_name}</h2>
            <p className="text-sm text-slate-500 mt-3">
              מסמך זה הופק בהתאם לחוק התכנון והבנייה, התשכ״ה–1965 ותקני מנהל התכנון (מב״ת)
            </p>
          </div>

          {/* פרק א */}
          <DocSection letter="א" title="פרטים מזהים">
            <DocRow label="שם התוכנית" value={project.plan_name} />
            <DocRow label="מספר תוכנית" value={project.plan_number} />
            <DocRow label="גוש" value={project.block} />
            <DocRow label="חלקה" value={project.parcel} />
            <DocRow label="סוג תוכנית" value={getPlanTypeLabel(project.plan_type)} />
            {project.submitted_by && <DocRow label="הוגש על ידי" value={project.submitted_by} />}
            {project.submission_date && <DocRow label="תאריך הגשה" value={project.submission_date} />}
          </DocSection>

          {/* פרק ב */}
          <DocSection letter="ב" title="ייעודי קרקע">
            {regulation?.land_use?.length > 0 ? (
              <table className="w-full text-sm border-collapse mt-2">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="text-right py-2.5 px-3 font-semibold border border-slate-300">ייעוד קרקע</th>
                    <th className="text-right py-2.5 px-3 font-semibold border border-slate-300">שטח (מ״ר)</th>
                    <th className="text-right py-2.5 px-3 font-semibold border border-slate-300">אחוז מהתוכנית</th>
                  </tr>
                </thead>
                <tbody>
                  {regulation.land_use.map((zone, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                      <td className="py-2.5 px-3 border border-slate-200">{zone.description}</td>
                      <td className="py-2.5 px-3 border border-slate-200">{zone.area_sqm ? zone.area_sqm.toLocaleString("he-IL") : "—"}</td>
                      <td className="py-2.5 px-3 border border-slate-200">{zone.percentage ? `${zone.percentage}%` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-slate-400 text-sm italic">לא הוגדרו ייעודי קרקע</p>
            )}
          </DocSection>

          {/* פרק ג */}
          <DocSection letter="ג" title="זכויות בנייה">
            <div className="grid grid-cols-2 gap-x-12">
              <div className="space-y-0">
                <DocRow label="אחוזי בנייה" value={regulation?.building_rights_percent != null ? `${regulation.building_rights_percent}%` : null} />
                <DocRow label="מספר קומות מרבי" value={regulation?.max_floors} />
                <DocRow label="גובה מרבי" value={regulation?.max_height != null ? `${regulation.max_height} מ׳` : null} />
                <DocRow label="יחס חניה" value={regulation?.parking_ratio != null ? `${regulation.parking_ratio} לדירה` : null} />
              </div>
              <div className="space-y-0">
                <DocRow label="קו בניין קדמי" value={regulation?.front_setback != null ? `${regulation.front_setback} מ׳` : null} />
                <DocRow label="קו בניין צידי" value={regulation?.side_setback != null ? `${regulation.side_setback} מ׳` : null} />
                <DocRow label="קו בניין אחורי" value={regulation?.rear_setback != null ? `${regulation.rear_setback} מ׳` : null} />
                <DocRow label="שטח ירוק" value={regulation?.green_area_percent != null ? `${regulation.green_area_percent}%` : null} />
              </div>
            </div>
          </DocSection>

          {/* פרק ד */}
          <DocSection letter="ד" title="הוראות מיוחדות">
            {regulation?.special_instructions ? (
              <p className="text-sm text-slate-800 leading-8 whitespace-pre-wrap mt-2">
                {regulation.special_instructions}
              </p>
            ) : (
              <p className="text-slate-400 text-sm italic">לא הוגדרו הוראות מיוחדות לתוכנית זו</p>
            )}
          </DocSection>

          {/* Attachments */}
          {regulation?.attachments?.some((a) => a.included) && (
            <DocSection letter="ה" title="נספחים">
              <ul className="mt-2 space-y-1.5">
                {regulation.attachments
                  .filter((a) => a.included)
                  .map((att, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm">
                      <span className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center text-[10px] font-bold text-primary shrink-0">{idx + 1}</span>
                      {att.name}
                      {att.required && <span className="text-xs text-slate-400">(נספח חובה)</span>}
                    </li>
                  ))}
              </ul>
            </DocSection>
          )}

          {/* Footer */}
          <div className="border-t border-slate-300 pt-6 mt-8 text-center">
            <p className="text-xs text-slate-400">
              הופק ממערכת הוראות תוכנית | תאריך הפקה: {new Date().toLocaleDateString("he-IL")}
            </p>
          </div>

        </div>
      </Card>
    </div>
  );
}

function DocSection({ letter, title, children }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
          <span className="text-white text-sm font-bold">{letter}</span>
        </div>
        <h2 className="text-lg font-bold text-slate-800 border-b-2 border-slate-200 pb-1 flex-1">
          פרק {letter} — {title}
        </h2>
      </div>
      <div className="mr-11">{children}</div>
    </div>
  );
}

function DocRow({ label, value }) {
  if (value == null || value === "") return null;
  return (
    <div className="flex items-center py-2 border-b border-slate-100 last:border-0">
      <span className="text-slate-500 text-sm w-44 shrink-0">{label}:</span>
      <span className="font-semibold text-slate-800 text-sm">{value}</span>
    </div>
  );
}