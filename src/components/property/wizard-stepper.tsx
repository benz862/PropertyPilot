import { Progress } from "@/components/ui/progress";
import { wizardSteps } from "@/lib/navigation/routes";
import { cn } from "@/lib/utils";

interface WizardStepperProps {
  currentStep: number;
  className?: string;
}

export function WizardStepper({ currentStep, className }: WizardStepperProps) {
  const progress = ((currentStep + 1) / wizardSteps.length) * 100;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">
          Step {currentStep + 1} of {wizardSteps.length}
        </span>
        <span className="text-muted-foreground">
          {wizardSteps[currentStep]?.label}
        </span>
      </div>
      <Progress value={progress} />
      <ol className="hidden gap-2 sm:grid sm:grid-cols-4 lg:grid-cols-8">
        {wizardSteps.map((step, index) => (
          <li
            key={step.id}
            className={cn(
              "rounded-lg border px-2 py-2 text-center text-xs",
              index === currentStep
                ? "border-primary bg-primary/5 font-medium text-primary"
                : index < currentStep
                  ? "border-border bg-card text-muted-foreground"
                  : "border-border/60 text-muted-foreground/60",
            )}
          >
            {step.label}
          </li>
        ))}
      </ol>
    </div>
  );
}
