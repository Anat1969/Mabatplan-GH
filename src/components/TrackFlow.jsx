import { Link } from "react-router-dom";
import { ChevronLeft, CheckCircle2 } from "lucide-react";

export default function TrackFlow({ steps, title, subtitle, color }) {
  return (
    <div className={`rounded-2xl border-2 ${color.border} bg-card p-6 space-y-5`}>
      <div>
        <h2 className={`text-lg font-bold ${color.text}`}>{title}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
      </div>
      <div className="flex items-start gap-0 overflow-x-auto pb-2">
        {steps.map((step, idx) => (
          <div key={idx} className="flex items-center shrink-0">
            <div className="flex flex-col items-center gap-2 min-w-[96px]">
              {step.href ? (
                <Link to={step.href}>
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all shadow-sm hover:scale-105 ${step.done ? "bg-emerald-500 text-white" : color.bg + " " + color.iconText}`}>
                    {step.done ? <CheckCircle2 className="w-5 h-5" /> : <step.Icon className="w-5 h-5" />}
                  </div>
                </Link>
              ) : (
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${step.done ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"}`}>
                  {step.done ? <CheckCircle2 className="w-5 h-5" /> : <step.Icon className="w-5 h-5" />}
                </div>
              )}
              <span className="text-[11px] text-center text-muted-foreground leading-tight max-w-[88px]">{step.label}</span>
            </div>
            {idx < steps.length - 1 && (
              <ChevronLeft className="w-4 h-4 text-muted-foreground/40 mx-1 mb-5 shrink-0" />
            )}
          </div>
        ))}
      </div>
      {steps.filter(s => s.href && !s.done).length > 0 && (
        <Link
          to={steps.find(s => s.href && !s.done)?.href || "/"}
          className={`inline-flex items-center gap-1.5 text-sm font-medium ${color.text} hover:underline`}
        >
          המשך מהשלב הבא
          <ChevronLeft className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  );
}