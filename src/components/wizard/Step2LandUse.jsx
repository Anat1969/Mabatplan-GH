import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, Lightbulb } from "lucide-react";
import { ZONE_TYPES, ZONE_DEFAULTS } from "../../lib/mabatDefaults";

export default function Step2LandUse({ regulation, onChange, onApplyDefaults }) {
  const [selectedZone, setSelectedZone] = useState("");
  const landUse = regulation.land_use || [];

  const addZone = () => {
    if (!selectedZone) return;
    const zoneInfo = ZONE_DEFAULTS[selectedZone];
    const newEntry = {
      zone_type: selectedZone,
      area_sqm: 0,
      percentage: 0,
      description: zoneInfo.label,
    };
    onChange({ ...regulation, land_use: [...landUse, newEntry] });
    // Auto-apply MABAT defaults to building rights on first zone added
    if (landUse.length === 0 && onApplyDefaults) {
      onApplyDefaults(zoneInfo);
    }
    setSelectedZone("");
  };

  const removeZone = (idx) => {
    const updated = landUse.filter((_, i) => i !== idx);
    onChange({ ...regulation, land_use: updated });
  };

  const updateZone = (idx, field, value) => {
    const updated = landUse.map((item, i) =>
      i === idx ? { ...item, [field]: value } : item
    );
    onChange({ ...regulation, land_use: updated });
  };

  const applyDefaults = (zoneType) => {
    const defaults = ZONE_DEFAULTS[zoneType];
    if (defaults && onApplyDefaults) {
      onApplyDefaults(defaults);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">ייעודי קרקע</h2>
        <p className="text-sm text-muted-foreground">הגדירו את ייעודי הקרקע בתחום התוכנית</p>
      </div>

      {/* Add Zone */}
      <div className="flex gap-3 items-end">
        <div className="flex-1 space-y-2">
          <Label>הוספת ייעוד</Label>
          <Select value={selectedZone} onValueChange={setSelectedZone}>
            <SelectTrigger>
              <SelectValue placeholder="בחרו ייעוד קרקע" />
            </SelectTrigger>
            <SelectContent>
              {ZONE_TYPES.map((z) => (
                <SelectItem key={z.value} value={z.value}>
                  {z.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={addZone} disabled={!selectedZone} className="gap-2">
          <Plus className="w-4 h-4" />
          הוספה
        </Button>
      </div>

      {/* Zone List */}
      {landUse.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          לא נבחרו ייעודי קרקע עדיין. הוסיפו ייעוד מהרשימה למעלה.
        </div>
      ) : (
        <div className="space-y-3">
          {landUse.map((zone, idx) => (
            <Card key={idx} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-sm text-foreground">{zone.description}</h4>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-xs text-primary h-7"
                    onClick={() => applyDefaults(zone.zone_type)}
                  >
                    <Lightbulb className="w-3.5 h-3.5" />
                    ברירות מחדל MABAT
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => removeZone(idx)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">שטח (מ״ר)</Label>
                  <Input
                    type="number"
                    value={zone.area_sqm || ""}
                    onChange={(e) => updateZone(idx, "area_sqm", Number(e.target.value))}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">אחוז משטח התוכנית</Label>
                  <Input
                    type="number"
                    value={zone.percentage || ""}
                    onChange={(e) => updateZone(idx, "percentage", Number(e.target.value))}
                    placeholder="0"
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}