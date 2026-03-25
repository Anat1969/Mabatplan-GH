import { Check } from "lucide-react";

const STEPS = [
  { number: 1, label: "פרטים מזהים" },
  { number: 2, label: "ייעודי קרקע" },
  { number: 3, label: "זכויות בנייה" },
  { number: 4, label: "הוראות מיוחדות" },
  { number: 5, label: "נספחים" },
];

export default function StepIndicator({ currentStep, completedSteps = [] }) {
  return (
    <div className="flex items-center gap-0 w-full">
      {STEPS.map((step, idx) => {
        const isActive = currentStep === step.number;
        const isCompleted = completedSteps.includes(step.number);
        const isLast = idx === STEPS.length - 1;

        return (
          <div key={step.number} className={`flex items-center ${isLast ? "" : "flex-1"}`}>
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/25 scale-110"
                    : isCompleted
                    ? "bg-accent text-accent-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : step.number}
              </div>
              <span
                className={`text-[11px] font-medium whitespace-nowrap ${
                  isActive ? "text-primary" : isCompleted ? "text-accent" : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div
                className={`h-0.5 flex-1 mx-2 mt-[-18px] rounded-full transition-colors duration-300 ${
                  isCompleted ? "bg-accent" : "bg-border"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}