import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { STANDARD_ATTACHMENTS } from "../../lib/mabatDefaults";

export default function Step5Attachments({ regulation, onChange }) {
  const attachments = regulation.attachments || STANDARD_ATTACHMENTS.map((a) => ({
    ...a,
    included: false,
  }));

  const toggleAttachment = (idx) => {
    const updated = attachments.map((a, i) =>
      i === idx ? { ...a, included: !a.included } : a
    );
    onChange({ ...regulation, attachments: updated });
  };

  const requiredCount = attachments.filter((a) => a.required).length;
  const requiredIncluded = attachments.filter((a) => a.required && a.included).length;
  const optionalIncluded = attachments.filter((a) => !a.required && a.included).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">נספחים</h2>
        <p className="text-sm text-muted-foreground">סמנו את הנספחים המצורפים לתוכנית</p>
      </div>

      <div className="flex items-center gap-4 text-sm">
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
          חובה: {requiredIncluded}/{requiredCount}
        </Badge>
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          רשות: {optionalIncluded}
        </Badge>
      </div>

      <div className="space-y-2">
        {attachments.map((att, idx) => (
          <div
            key={idx}
            className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
              att.included
                ? "bg-primary/5 border-primary/20"
                : "bg-card border-border hover:bg-muted/50"
            }`}
            onClick={() => toggleAttachment(idx)}
          >
            <Checkbox checked={att.included} />
            <div className="flex-1">
              <Label className="cursor-pointer font-medium text-sm">{att.name}</Label>
            </div>
            {att.required && (
              <Badge variant="outline" className="text-[10px] bg-red-50 text-red-600 border-red-200">
                חובה
              </Badge>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}