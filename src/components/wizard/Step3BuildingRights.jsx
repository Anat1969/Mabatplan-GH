import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building, Ruler, ArrowUp, ParkingCircle, TreePine } from "lucide-react";

const FIELDS = [
  { key: "building_rights_percent", label: "אחוזי בנייה (%)", icon: Building, placeholder: "120" },
  { key: "max_floors", label: "מספר קומות מרבי", icon: ArrowUp, placeholder: "8" },
  { key: "max_height", label: "גובה מרבי (מטר)", icon: ArrowUp, placeholder: "25" },
  { key: "front_setback", label: "קו בניין קדמי (מטר)", icon: Ruler, placeholder: "5" },
  { key: "side_setback", label: "קו בניין צידי (מטר)", icon: Ruler, placeholder: "4" },
  { key: "rear_setback", label: "קו בניין אחורי (מטר)", icon: Ruler, placeholder: "4" },
  { key: "parking_ratio", label: "יחס חניה (לדירה)", icon: ParkingCircle, placeholder: "1.5" },
  { key: "green_area_percent", label: "אחוז שטח ירוק (%)", icon: TreePine, placeholder: "25" },
];

export default function Step3BuildingRights({ regulation, onChange }) {
  const update = (field, value) => {
    onChange({ ...regulation, [field]: value === "" ? null : Number(value) });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">זכויות בנייה</h2>
        <p className="text-sm text-muted-foreground">הגדירו את זכויות הבנייה, קווי בניין ומגבלות נוספות</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {FIELDS.map((field) => (
          <div key={field.key} className="space-y-2">
            <Label className="flex items-center gap-2">
              <field.icon className="w-4 h-4 text-muted-foreground" />
              {field.label}
            </Label>
            <Input
              type="number"
              step="any"
              placeholder={field.placeholder}
              value={regulation[field.key] ?? ""}
              onChange={(e) => update(field.key, e.target.value)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}