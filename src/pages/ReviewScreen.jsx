import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ArrowRight, Download, CheckCircle2, XCircle, MinusCircle, Send } from "lucide-react";
import { getPlanTypeLabel } from "../components/StatusBadge";
import { toast } from "sonner";

const CHECKLIST_ITEMS = [
  { code: "B1", label: "פרטים מזהים מלאים" },
  { code: "B2", label: "ייעוד קרקע תואם תוכנית מתאר" },
  { code: "B3", label: "זכויות בנייה בגבולות המותרים" },
  { code: "B4", label: "קווי בניין תקינים" },
  { code: "B5", label: "דרישות חניה עמידה בתקן" },
  { code: "B6", label: "שטחי ירוק לפי חוק" },
  { code: "B7", label: "הוראות מיוחדות ברורות וחד-משמעיות" },
  { code: "B8", label: "נספחים מצורפים ומלאים" },
];

const DECISION_OPTIONS = [
  { value: "approved", label: "אישור ✓", active: "bg-green-100 border-green-500 text-green-700" },
  { value: "rejected", label: "דחייה ✗", active: "bg-red-100 border-red-500 text-red-700" },
  { value: "requires_changes", label: "דרוש תיקונים ⚠", active: "bg-amber-100 border-amber-500 text-amber-700" },
];

function initChecklist() {
  const obj = {};
  CHECKLIST_ITEMS.forEach((item) => { obj[item.code] = { status: null, comment: "" }; });
  return obj;
}

export default function ReviewScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const certRef = useRef(null);

  const [project, setProject] = useState(null);
  const [regulation, setRegulation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [user, setUser] = useState(null);
  const [existingDecisionId, setExistingDecisionId] = useState(null);

  const [checklist, setChecklist] = useState(initChecklist());
  const [generalComment, setGeneralComment] = useState("");
  const [decision, setDecision] = useState(null);
  const [corrections, setCorrections] = useState("");
  const [signerName, setSignerName] = useState("");

  useEffect(() => { load(); }, [id]);

  async function load() {
    setLoading(true);
    const me = await api.auth.me();
    setUser(me);
    if (me?.full_name) setSignerName(me.full_name);

    const projects = await api.entities.Project.list();
    const proj = projects.find((p) => p.id === id);
    setProject(proj);

    if (proj) {
      const round = proj.review_round || 1;
      const [regs, decisions, checklistItems] = await Promise.all([
        api.entities.Regulation.filter({ project_id: id }),
        api.entities.ReviewDecision.filter({ project_id: id }),
        api.entities.ReviewChecklist.filter({ project_id: id }),
      ]);

      if (regs.length > 0) setRegulation(regs[0]);

      const roundDecision = decisions.find((d) => d.round === round);
      if (roundDecision) {
        setExistingDecisionId(roundDecision.id);
        setDecision(roundDecision.decision);
        setCorrections(roundDecision.required_corrections || "");
        setGeneralComment(roundDecision.decision_reason || "");
        setSignerName(roundDecision.signature_name || me?.full_name || "");
        setSubmitted(true);
      }

      const roundChecklist = checklistItems.filter((c) => c.round === round);
      if (roundChecklist.length > 0) {
        const cl = initChecklist();
        roundChecklist.forEach((item) => {
          if (cl[item.item_code] !== undefined) {
            cl[item.item_code] = { status: item.status, comment: item.comment || "" };
          }
        });
        setChecklist(cl);
      }

      // Mark as in_review if still pending
      if (proj.review_status === "pending") {
        await api.entities.Project.update(id, { review_status: "in_review" });
        setProject((prev) => ({ ...prev, review_status: "in_review" }));
      }
    }
    setLoading(false);
  }

  const updateChecklist = (code, field, value) => {
    setChecklist((prev) => ({ ...prev, [code]: { ...prev[code], [field]: value } }));
  };

  async function handleSubmit() {
    if (!decision) { toast.error("יש לבחור החלטה"); return; }
    if (!signerName.trim()) { toast.error("יש להזין את שם הבוחן"); return; }

    setSubmitting(true);
    const round = project.review_round || 1;

    // Delete + recreate checklist items for this round
    const existing = await api.entities.ReviewChecklist.filter({ project_id: id });
    const roundItems = existing.filter((c) => c.round === round);
    await Promise.all(roundItems.map((c) => api.entities.ReviewChecklist.delete(c.id)));
    await Promise.all(
      CHECKLIST_ITEMS.map((item) =>
        api.entities.ReviewChecklist.create({
          project_id: id,
          reviewer_id: user?.id,
          round,
          item_code: item.code,
          item_label: item.label,
          status: checklist[item.code]?.status || "not_applicable",
          comment: checklist[item.code]?.comment || "",
        })
      )
    );

    const decisionData = {
      project_id: id,
      reviewer_id: user?.id,
      round,
      decision,
      decision_reason: generalComment,
      required_corrections: decision === "requires_changes" ? corrections : "",
      decision_date: new Date().toISOString(),
      signature_name: signerName,
    };

    if (existingDecisionId) {
      await api.entities.ReviewDecision.update(existingDecisionId, decisionData);
    } else {
      const created = await api.entities.ReviewDecision.create(decisionData);
      setExistingDecisionId(created.id);
    }

    await api.entities.Project.update(id, {
      review_status: decision,
      assigned_reviewer: user?.email,
    });

    setProject((prev) => ({ ...prev, review_status: decision }));
    setSubmitted(true);
    setSubmitting(false);
    toast.success("ההחלטה נשלחה בהצלחה");
  }

  async function handleExportPDF() {
    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");
    const element = certRef.current;
    const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;
    pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
    heightLeft -= pdfHeight;
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;
    }
    pdf.save(`אישור_בדיקה_${project.plan_number}.pdf`);
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
        <p className="text-muted-foreground">התוכנית לא נמצאה</p>
        <Link to="/reviewer-dashboard"><Button variant="outline" className="mt-4">חזרה ללוח בוחנים</Button></Link>
      </div>
    );
  }

  const round = project.review_round || 1;

  return (
    <div className="space-y-4" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/reviewer-dashboard")}>
            <ArrowRight className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">בדיקת תוכנית מס׳ {project.plan_number}</h1>
            <p className="text-sm text-muted-foreground">{project.plan_name} — סבב {round}</p>
          </div>
        </div>
        {submitted && (
          <Button onClick={handleExportPDF} className="gap-2">
            <Download className="w-4 h-4" />
            הורד אישור PDF
          </Button>
        )}
      </div>

      {/* Split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {/* LEFT — Plan content read-only */}
        <Card className="p-5 space-y-5">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide border-b pb-2">
            תוכן התוכנית — קריאה בלבד
          </h2>

          <PlanSection title="פרק א — פרטים מזהים">
            <PlanRow label="שם תוכנית" value={project.plan_name} />
            <PlanRow label="מספר תוכנית" value={project.plan_number} />
            <PlanRow label="גוש" value={project.block} />
            <PlanRow label="חלקה" value={project.parcel} />
            <PlanRow label="סוג תוכנית" value={getPlanTypeLabel(project.plan_type)} />
            <PlanRow label="הוגש על ידי" value={project.submitted_by} />
            <PlanRow label="תאריך הגשה" value={project.submission_date} />
          </PlanSection>

          <PlanSection title="פרק ב — ייעודי קרקע">
            {regulation?.land_use?.length > 0 ? (
              <table className="w-full text-xs border-collapse mt-1">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-right py-1.5 px-2 border border-border">ייעוד</th>
                    <th className="text-right py-1.5 px-2 border border-border">שטח (מ״ר)</th>
                    <th className="text-right py-1.5 px-2 border border-border">אחוז</th>
                  </tr>
                </thead>
                <tbody>
                  {regulation.land_use.map((z, i) => (
                    <tr key={i}>
                      <td className="py-1.5 px-2 border border-border">{z.description}</td>
                      <td className="py-1.5 px-2 border border-border">{z.area_sqm?.toLocaleString("he-IL") || "—"}</td>
                      <td className="py-1.5 px-2 border border-border">{z.percentage ? `${z.percentage}%` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p className="text-muted-foreground text-xs italic">לא הוגדרו</p>}
          </PlanSection>

          <PlanSection title="פרק ג — זכויות בנייה">
            <div className="grid grid-cols-2 gap-x-4">
              <PlanRow label="אחוזי בנייה" value={regulation?.building_rights_percent != null ? `${regulation.building_rights_percent}%` : null} />
              <PlanRow label="קומות מרביות" value={regulation?.max_floors} />
              <PlanRow label="גובה מרבי" value={regulation?.max_height != null ? `${regulation.max_height} מ׳` : null} />
              <PlanRow label="יחס חניה" value={regulation?.parking_ratio != null ? `${regulation.parking_ratio} לדירה` : null} />
              <PlanRow label="קו בניין קדמי" value={regulation?.front_setback != null ? `${regulation.front_setback} מ׳` : null} />
              <PlanRow label="קו בניין צידי" value={regulation?.side_setback != null ? `${regulation.side_setback} מ׳` : null} />
              <PlanRow label="קו בניין אחורי" value={regulation?.rear_setback != null ? `${regulation.rear_setback} מ׳` : null} />
              <PlanRow label="שטח ירוק" value={regulation?.green_area_percent != null ? `${regulation.green_area_percent}%` : null} />
            </div>
          </PlanSection>

          <PlanSection title="פרק ד — הוראות מיוחדות">
            {regulation?.special_instructions
              ? <p className="text-sm whitespace-pre-wrap">{regulation.special_instructions}</p>
              : <p className="text-muted-foreground text-xs italic">לא הוגדרו הוראות מיוחדות</p>}
          </PlanSection>

          <PlanSection title="פרק ה — נספחים">
            {regulation?.attachments?.some((a) => a.included) ? (
              <ul className="space-y-1">
                {regulation.attachments.filter((a) => a.included).map((att, i) => (
                  <li key={i} className="text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-green-600 shrink-0" />
                    {att.name}
                  </li>
                ))}
              </ul>
            ) : <p className="text-muted-foreground text-xs italic">לא צורפו נספחים</p>}
          </PlanSection>
        </Card>

        {/* RIGHT — Review tools */}
        <div className="space-y-4">
          {/* Checklist */}
          <Card className="p-5 space-y-4">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide border-b pb-2">
              רשימת תיוג — דרישות מב״ת
            </h2>
            {CHECKLIST_ITEMS.map((item) => (
              <div key={item.code} className="flex items-start gap-2">
                <span className="text-xs font-mono text-muted-foreground pt-1 min-w-[28px]">{item.code}</span>
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-medium">{item.label}</p>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { val: "pass", label: "עבר", Icon: CheckCircle2, active: "bg-green-100 border-green-500 text-green-700" },
                      { val: "fail", label: "נכשל", Icon: XCircle, active: "bg-red-100 border-red-500 text-red-700" },
                      { val: "not_applicable", label: "לא רלוונטי", Icon: MinusCircle, active: "bg-gray-100 border-gray-400 text-gray-700" },
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        disabled={submitted}
                        onClick={() => updateChecklist(item.code, "status", opt.val)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                          checklist[item.code]?.status === opt.val
                            ? opt.active
                            : "border-border bg-background text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        <opt.Icon className="w-3.5 h-3.5" />
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {!submitted ? (
                    <Input
                      placeholder="הערה (אופציונלי)"
                      value={checklist[item.code]?.comment || ""}
                      onChange={(e) => updateChecklist(item.code, "comment", e.target.value)}
                      className="text-xs h-7"
                    />
                  ) : checklist[item.code]?.comment ? (
                    <p className="text-xs text-muted-foreground">{checklist[item.code].comment}</p>
                  ) : null}
                </div>
              </div>
            ))}
          </Card>

          {/* General comment */}
          <Card className="p-5 space-y-3">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide border-b pb-2">הערות כלליות למגיש</h2>
            <Textarea
              placeholder="הזינו הערות כלליות..."
              value={generalComment}
              onChange={(e) => setGeneralComment(e.target.value)}
              disabled={submitted}
              rows={3}
            />
          </Card>

          {/* Decision */}
          <Card className="p-5 space-y-4">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide border-b pb-2">החלטת בוחן</h2>
            <div className="flex gap-2">
              {DECISION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  disabled={submitted}
                  onClick={() => setDecision(opt.value)}
                  className={`flex-1 py-2.5 rounded-lg border-2 text-xs font-semibold transition-all ${
                    decision === opt.value ? opt.active : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {decision === "requires_changes" && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium">פירוט תיקונים נדרשים *</label>
                <Textarea
                  placeholder="פרטו את התיקונים הנדרשים..."
                  value={corrections}
                  onChange={(e) => setCorrections(e.target.value)}
                  disabled={submitted}
                  rows={4}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium">שם הבוחן</label>
              <Input
                placeholder="שם מלא"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                disabled={submitted}
              />
            </div>

            {!submitted ? (
              <Button onClick={handleSubmit} disabled={submitting} className="w-full gap-2">
                <Send className="w-4 h-4" />
                {submitting ? "שולח..." : "שלח החלטה"}
              </Button>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                <p className="text-green-700 text-sm font-semibold">ההחלטה נשלחה בהצלחה ✓</p>
                <p className="text-green-600 text-xs mt-0.5">{new Date().toLocaleDateString("he-IL")}</p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Hidden PDF certificate */}
      {submitted && (
        <div className="fixed -left-[9999px] top-0 pointer-events-none">
          <div ref={certRef} style={{ fontFamily: "'Heebo', sans-serif", width: "794px", padding: "48px", backgroundColor: "#fff", direction: "rtl" }}>
            <div style={{ textAlign: "center", borderBottom: "4px solid #1e293b", paddingBottom: "24px", marginBottom: "32px" }}>
              <p style={{ fontSize: "11px", color: "#64748b", letterSpacing: "2px", marginBottom: "8px" }}>מדינת ישראל — מינהל התכנון</p>
              <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a" }}>אישור בדיקה — תוכנית מס׳ {project.plan_number}</h1>
              <p style={{ fontSize: "14px", color: "#475569", marginTop: "6px" }}>{project.plan_name} | סבב בדיקה {round}</p>
            </div>

            <section style={{ marginBottom: "28px" }}>
              <h2 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "12px", borderBottom: "1px solid #e2e8f0", paddingBottom: "6px" }}>פרטי התוכנית</h2>
              {[
                ["שם תוכנית", project.plan_name],
                ["מספר תוכנית", project.plan_number],
                ["גוש / חלקה", `${project.block || "—"} / ${project.parcel || "—"}`],
                ["מגיש", project.submitted_by || "—"],
                ["תאריך הגשה", project.submission_date || "—"],
              ].map(([label, val]) => (
                <div key={label} style={{ display: "flex", gap: "8px", padding: "6px 0", borderBottom: "1px solid #f1f5f9" }}>
                  <span style={{ color: "#64748b", width: "140px", flexShrink: 0, fontSize: "13px" }}>{label}:</span>
                  <span style={{ fontWeight: 600, fontSize: "13px" }}>{val}</span>
                </div>
              ))}
            </section>

            <section style={{ marginBottom: "28px" }}>
              <h2 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "12px", borderBottom: "1px solid #e2e8f0", paddingBottom: "6px" }}>תוצאות רשימת התיוג</h2>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f8fafc" }}>
                    <th style={{ textAlign: "right", padding: "8px", border: "1px solid #cbd5e1" }}>קוד</th>
                    <th style={{ textAlign: "right", padding: "8px", border: "1px solid #cbd5e1" }}>פריט</th>
                    <th style={{ textAlign: "right", padding: "8px", border: "1px solid #cbd5e1" }}>תוצאה</th>
                    <th style={{ textAlign: "right", padding: "8px", border: "1px solid #cbd5e1" }}>הערה</th>
                  </tr>
                </thead>
                <tbody>
                  {CHECKLIST_ITEMS.map((item) => (
                    <tr key={item.code}>
                      <td style={{ padding: "7px 8px", border: "1px solid #e2e8f0", fontFamily: "monospace" }}>{item.code}</td>
                      <td style={{ padding: "7px 8px", border: "1px solid #e2e8f0" }}>{item.label}</td>
                      <td style={{ padding: "7px 8px", border: "1px solid #e2e8f0" }}>
                        {checklist[item.code]?.status === "pass" ? "✓ עבר" : checklist[item.code]?.status === "fail" ? "✗ נכשל" : "— לא רלוונטי"}
                      </td>
                      <td style={{ padding: "7px 8px", border: "1px solid #e2e8f0", color: "#64748b" }}>{checklist[item.code]?.comment || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section style={{ marginBottom: "32px" }}>
              <h2 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "12px", borderBottom: "1px solid #e2e8f0", paddingBottom: "6px" }}>החלטת הבוחן</h2>
              {[
                ["החלטה", decision === "approved" ? "אושר ✓" : decision === "rejected" ? "נדחה ✗" : "דרוש תיקונים ⚠"],
                generalComment && ["הערות כלליות", generalComment],
                corrections && ["תיקונים נדרשים", corrections],
              ].filter(Boolean).map(([label, val]) => (
                <div key={label} style={{ display: "flex", gap: "8px", padding: "6px 0", borderBottom: "1px solid #f1f5f9" }}>
                  <span style={{ color: "#64748b", width: "140px", flexShrink: 0, fontSize: "13px" }}>{label}:</span>
                  <span style={{ fontWeight: 500, fontSize: "13px", whiteSpace: "pre-wrap" }}>{val}</span>
                </div>
              ))}
            </section>

            <div style={{ borderTop: "2px solid #1e293b", paddingTop: "20px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
              <div>
                <p style={{ fontSize: "14px", fontWeight: 600 }}>שם הבוחן: {signerName}</p>
                <p style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}>תאריך: {new Date().toLocaleDateString("he-IL")}</p>
                <p style={{ fontSize: "13px", color: "#64748b" }}>סבב בדיקה: {round}</p>
              </div>
              <div style={{ textAlign: "left" }}>
                <p style={{ fontSize: "11px", color: "#94a3b8" }}>הופק ממערכת הוראות תוכנית</p>
                <p style={{ fontSize: "11px", color: "#94a3b8" }}>מסמך רשמי</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PlanSection({ title, children }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <div>{children}</div>
    </div>
  );
}

function PlanRow({ label, value }) {
  if (value == null || value === "") return null;
  return (
    <div className="flex items-center py-1.5 border-b border-muted/50 last:border-0">
      <span className="text-xs text-muted-foreground w-32 shrink-0">{label}:</span>
      <span className="text-xs font-medium">{value}</span>
    </div>
  );
}