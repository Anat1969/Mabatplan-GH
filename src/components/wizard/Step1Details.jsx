import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

const PLAN_TYPES = [
  { value: "new", label: "תוכנית חדשה" },
  { value: "change", label: "שינוי תוכנית" },
  { value: "consolidation", label: "איחוד" },
  { value: "parcellation", label: "חלוקה" },
];

export default function Step1Details({ project, onChange }) {
  const update = (field, value) => onChange({ ...project, [field]: value });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">פרטים מזהים</h2>
        <p className="text-sm text-muted-foreground">הזינו את פרטי התוכנית הבסיסיים</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>שם תוכנית *</Label>
          <Input
            placeholder="לדוגמה: שכונת הפרדס"
            value={project.plan_name || ""}
            onChange={(e) => update("plan_name", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>מספר תוכנית *</Label>
          <Input
            placeholder="לדוגמה: 101-0825432"
            value={project.plan_number || ""}
            onChange={(e) => update("plan_number", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>גוש</Label>
          <Input
            placeholder="הזינו מספר גוש"
            value={project.block || ""}
            onChange={(e) => update("block", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>חלקה</Label>
          <Input
            placeholder="הזינו מספר חלקה"
            value={project.parcel || ""}
            onChange={(e) => update("parcel", e.target.value)}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>סוג תוכנית *</Label>
          <Select value={project.plan_type || ""} onValueChange={(v) => update("plan_type", v)}>
            <SelectTrigger>
              <SelectValue placeholder="בחרו סוג תוכנית" />
            </SelectTrigger>
            <SelectContent>
              {PLAN_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      <div>
        <p className="text-sm font-medium text-foreground mb-4">פרטי מגיש</p>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>הוגש על ידי</Label>
            <Input
              placeholder="שם המגיש / הגורם המתכנן"
              value={project.submitted_by || ""}
              onChange={(e) => update("submitted_by", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>תאריך הגשה</Label>
            <Input
              type="date"
              value={project.submission_date || ""}
              onChange={(e) => update("submission_date", e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}