import { useRef, useState } from "react";
import { UserCircle, Download, Upload } from "lucide-react";
import { api } from "@/api/client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const ROLES = [
  { value: "user", label: "אדריכל" },
  { value: "reviewer", label: "בוחן" },
  { value: "admin", label: "מנהל" },
];

export default function UserMenu() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.full_name || "");
  const fileRef = useRef(null);

  const changeRole = async (role) => {
    await updateUser({ role });
    window.location.reload();
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(api.backup.export(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mabat-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!window.confirm("שחזור מגיבוי יחליף את כל הנתונים הקיימים בדפדפן זה. להמשיך?")) return;
      api.backup.import(data);
      window.location.reload();
    } catch (err) {
      window.alert(`שגיאה בשחזור: ${err.message}`);
    } finally {
      e.target.value = "";
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted">
          <UserCircle className="w-5 h-5" />
          <span className="hidden sm:inline">{user?.full_name || "פרופיל"}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 space-y-4" dir="rtl">
        <div className="space-y-2">
          <Label htmlFor="user-name">שם</Label>
          <div className="flex gap-2">
            <Input id="user-name" value={name} onChange={(e) => setName(e.target.value)} />
            <Button size="sm" onClick={() => updateUser({ full_name: name.trim() })}>שמירה</Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label>תפקיד</Label>
          <div className="grid grid-cols-3 gap-1">
            {ROLES.map((r) => (
              <Button
                key={r.value}
                size="sm"
                variant={user?.role === r.value ? "default" : "outline"}
                onClick={() => changeRole(r.value)}
              >
                {r.label}
              </Button>
            ))}
          </div>
        </div>
        <div className="space-y-2 border-t pt-3">
          <Label>גיבוי נתונים</Label>
          <p className="text-xs text-muted-foreground">הנתונים נשמרים בדפדפן זה בלבד. מומלץ לגבות מדי פעם.</p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={exportData}>
              <Download className="w-4 h-4" /> ייצוא
            </Button>
            <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => fileRef.current?.click()}>
              <Upload className="w-4 h-4" /> שחזור
            </Button>
          </div>
          <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={importData} />
        </div>
      </PopoverContent>
    </Popover>
  );
}
