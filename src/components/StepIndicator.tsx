import { cn } from "../lib/utils";
import { Check } from "lucide-react";

interface StepIndicatorProps {
  step: number;
  onStepClick?: (stepNumber: number) => void;
}

const steps = [
  { id: 1, label: "Trip Details" },
  { id: 2, label: "Listings" },
  { id: 3, label: "Categories" },
];

export function StepIndicator({ step, onStepClick }: StepIndicatorProps) {
  const progressWidth = ((step - 1) / (steps.length - 1)) * 100;

  return (
    <nav aria-label="Wizard progress" className="w-full max-w-2xl mx-auto mb-12 px-4">
      <ol className="relative flex items-start justify-between">
        {/* Background track */}
        <div
          className="absolute left-0 w-full h-px bg-white/20"
          style={{ top: "20px" }}
          aria-hidden="true"
        />

        {/* Animated progress fill */}
        <div
          className="absolute left-0 h-px bg-white"
          style={{
            top: "20px",
            width: `${progressWidth}%`,
            transition: "width 500ms cubic-bezier(0.25, 1, 0.5, 1)",
          }}
          aria-hidden="true"
        />

        {steps.map((s) => {
          const isCompleted = step > s.id;
          const isActive = step === s.id;
          const isClickable = isCompleted && !!onStepClick;

          return (
            <li key={s.id} className="relative flex flex-col items-center">
              <button
                type="button"
                onClick={isClickable ? () => onStepClick!(s.id) : undefined}
                disabled={!isClickable}
                aria-current={isActive ? "step" : undefined}
                aria-label={`Step ${s.id} of ${steps.length}: ${s.label}${
                  isCompleted ? ", completed" : isActive ? ", current" : ""
                }`}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2",
                  "transition-[color,transform,box-shadow,background-color,border-color,opacity] duration-300",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
                  isCompleted
                    ? "bg-transparent border-white/50 text-white/60 cursor-pointer hover:border-white hover:text-white hover:bg-white/10"
                    : isActive
                      ? "bg-white border-white text-gray-900 scale-105 shadow-md shadow-black/20 cursor-default"
                      : "bg-white/10 border-white/25 text-white/30 cursor-default",
                )}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4 stroke-[2.5]" />
                ) : (
                  <span>{s.id}</span>
                )}
              </button>

              <span
                className={cn(
                  "mt-3 text-xs font-semibold tracking-tight whitespace-nowrap",
                  "[text-shadow:0_1px_6px_rgba(0,0,0,0.6)]",
                  "transition-[color,opacity] duration-300",
                  isActive ? "text-white" : isCompleted ? "text-white/60" : "text-white/30",
                )}
                aria-hidden="true"
              >
                {s.label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
