import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function Step4SpecialInstructions({ regulation, onChange }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">הוראות מיוחדות</h2>
        <p className="text-sm text-muted-foreground">
          הוסיפו הוראות מיוחדות שאינן נכללות בסעיפים הסטנדרטיים
        </p>
      </div>

      <div className="space-y-2">
        <Label>הוראות מיוחדות</Label>
        <Textarea
          placeholder="הזינו כאן הוראות מיוחדות הנדרשות לתוכנית, לדוגמה:&#10;- תנאים לשימושים חורגים&#10;- מגבלות בנייה מיוחדות&#10;- דרישות שימור&#10;- הנחיות עיצוב אדריכלי"
          value={regulation.special_instructions || ""}
          onChange={(e) => onChange({ ...regulation, special_instructions: e.target.value })}
          className="min-h-[280px] leading-relaxed"
        />
      </div>

      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <h4 className="text-sm font-semibold text-foreground mb-2">דוגמאות להוראות מיוחדות נפוצות:</h4>
        <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside">
          <li>בנייה ירוקה — עמידה בתקן SI 5281</li>
          <li>שימור מבנים — הגבלות על שינוי חזיתות</li>
          <li>הנגשת מבנים — דרישות מעבר לתקן</li>
          <li>תנאי תנועה — הגבלות כניסה/יציאה</li>
          <li>מיגון — דרישות מרחב מוגן</li>
        </ul>
      </div>
    </div>
  );
}