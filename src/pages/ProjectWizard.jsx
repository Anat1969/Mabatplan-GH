import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronRight, ChevronLeft, Save, Eye, ClipboardCheck } from "lucide-react";
import ReviewStatusTab from "../components/ReviewStatusTab";
import StepIndicator from "../components/StepIndicator";
import CompletionBar from "../components/CompletionBar";
import Step1Details from "../components/wizard/Step1Details";
import Step2LandUse from "../components/wizard/Step2LandUse";
import Step3BuildingRights from "../components/wizard/Step3BuildingRights";
import Step4SpecialInstructions from "../components/wizard/Step4SpecialInstructions";
import Step5Attachments from "../components/wizard/Step5Attachments";
import { calculateCompletionScore, STANDARD_ATTACHMENTS } from "../lib/mabatDefaults";
import { toast } from "sonner";

export default function ProjectWizard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = id && id !== "new";

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!isEditing);

  const [project, setProject] = useState({
    plan_name: "",
    plan_number: "",
    block: "",
    parcel: "",
    plan_type: "",
    status: "draft",
  });

  const [regulation, setRegulation] = useState({
    land_use: [],
    building_rights_percent: null,
    max_floors: null,
    max_height: null,
    front_setback: null,
    side_setback: null,
    rear_setback: null,
    parking_ratio: null,
    green_area_percent: null,
    special_instructions: "",
    attachments: STANDARD_ATTACHMENTS.map((a) => ({ ...a, included: false })),
  });

  const [regulationId, setRegulationId] = useState(null);
  const [activeView, setActiveView] = useState("wizard");

  useEffect(() => {
    if (isEditing) loadProject();
  }, [id]);

  async function loadProject() {
    setLoading(true);
    const proj = await api.entities.Project.list();
    const found = proj.find((p) => p.id === id);
    if (found) {
      setProject(found);
      if (found.review_status) setActiveView("review");
      const regs = await api.entities.Regulation.filter({ project_id: id });
      if (regs.length > 0) {
        setRegulation(regs[0]);
        setRegulationId(regs[0].id);
      }
    }
    setLoading(false);
  }

  const completionScore = calculateCompletionScore(project, regulation);

  const completedSteps = [];
  if (project.plan_name && project.plan_number && project.plan_type) completedSteps.push(1);
  if (regulation.land_use?.length > 0) completedSteps.push(2);
  if (regulation.building_rights_percent > 0 && regulation.max_floors > 0) completedSteps.push(3);
  if (regulation.special_instructions) completedSteps.push(4);
  if (regulation.attachments?.some((a) => a.included)) completedSteps.push(5);

  async function handleSave() {
    setSaving(true);
    let projectId = id;

    if (isEditing) {
      await api.entities.Project.update(id, {
        plan_name: project.plan_name,
        plan_number: project.plan_number,
        block: project.block,
        parcel: project.parcel,
        plan_type: project.plan_type,
        status: completionScore >= 80 ? "in_progress" : "draft",
      });
    } else {
      const created = await api.entities.Project.create({
        ...project,
        status: completionScore >= 80 ? "in_progress" : "draft",
      });
      projectId = created.id;
    }

    const regData = { ...regulation, project_id: projectId };
    if (regulationId) {
      await api.entities.Regulation.update(regulationId, regData);
    } else {
      const createdReg = await api.entities.Regulation.create(regData);
      setRegulationId(createdReg.id);
    }

    // Update/create validation
    const validations = await api.entities.Validation.filter({ project_id: projectId });
    const valData = {
      project_id: projectId,
      completion_score: completionScore,
    };
    if (validations.length > 0) {
      await api.entities.Validation.update(validations[0].id, valData);
    } else {
      await api.entities.Validation.create(valData);
    }

    setSaving(false);
    toast.success("התוכנית נשמרה בהצלחה");

    if (!isEditing) {
      navigate(`/project/${projectId}/edit`);
    }
  }

  async function handleSubmitForReview() {
    await api.entities.Project.update(id, {
      review_status: "pending",
      submitted_at: new Date().toISOString(),
    });
    setProject((prev) => ({ ...prev, review_status: "pending" }));
    setActiveView("review");
    toast.success("התוכנית הוגשה לבדיקה בהצלחה");
  }

  const applyMabatDefaults = (defaults) => {
    setRegulation((prev) => ({
      ...prev,
      building_rights_percent: defaults.building_rights_percent,
      max_floors: defaults.max_floors,
      max_height: defaults.max_height,
      front_setback: defaults.front_setback,
      side_setback: defaults.side_setback,
      rear_setback: defaults.rear_setback,
      parking_ratio: defaults.parking_ratio,
      green_area_percent: defaults.green_area_percent,
    }));
    toast.success("ערכי ברירת מחדל לפי תקני מנהל התכנון הוחלו");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            {isEditing ? `עריכת תוכנית: ${project.plan_name || ""}` : "תוכנית חדשה"}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">אשף יצירת הוראות תוכנית</p>
        </div>
        <div className="flex items-center gap-2">
          {isEditing && completionScore >= 80 && (
            <Button variant="outline" className="gap-2" onClick={() => navigate(`/project/${id}/preview`)}>
              <Eye className="w-4 h-4" />
              תצוגה מקדימה
            </Button>
          )}
          {isEditing && completionScore >= 80 && !project.review_status && (
            <Button className="gap-2" onClick={handleSubmitForReview}>
              <ClipboardCheck className="w-4 h-4" />
              הגש לבדיקה
            </Button>
          )}
        </div>
      </div>

      {/* Tab switcher */}
      {isEditing && project.review_status && (
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveView("wizard")}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeView === "wizard" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            עריכת תוכנית
          </button>
          <button
            onClick={() => setActiveView("review")}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeView === "review" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            מצב בדיקה
          </button>
        </div>
      )}

      {/* Completion */}
      <Card className="p-4">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-sm font-medium text-foreground">אחוז השלמה</span>
        </div>
        <CompletionBar score={completionScore} />
      </Card>

      {activeView === "review" && isEditing ? (
        <Card className="p-6">
          <ReviewStatusTab project={project} onResubmit={setProject} />
        </Card>
      ) : (
        <>
          {/* Step Indicator */}
          <div className="bg-card border border-border rounded-xl p-5">
            <StepIndicator currentStep={step} completedSteps={completedSteps} />
          </div>

          {/* Step Content */}
          <Card className="p-6">
            {step === 1 && <Step1Details project={project} onChange={setProject} />}
            {step === 2 && (
              <Step2LandUse
                regulation={regulation}
                onChange={setRegulation}
                onApplyDefaults={applyMabatDefaults}
              />
            )}
            {step === 3 && <Step3BuildingRights regulation={regulation} onChange={setRegulation} />}
            {step === 4 && <Step4SpecialInstructions regulation={regulation} onChange={setRegulation} />}
            {step === 5 && <Step5Attachments regulation={regulation} onChange={setRegulation} />}
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
              className="gap-2"
            >
              <ChevronRight className="w-4 h-4" />
              הקודם
            </Button>

            <Button onClick={handleSave} disabled={saving} variant="outline" className="gap-2">
              <Save className="w-4 h-4" />
              {saving ? "שומר..." : "שמירה"}
            </Button>

            <Button
              onClick={() => setStep(Math.min(5, step + 1))}
              disabled={step === 5}
              className="gap-2"
            >
              הבא
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}