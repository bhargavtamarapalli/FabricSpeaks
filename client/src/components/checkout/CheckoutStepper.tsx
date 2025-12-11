import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CheckoutStep } from "@/types/checkout";

interface StepConfig {
  key: CheckoutStep;
  label: string;
  description: string;
}

const STEPS: StepConfig[] = [
  {
    key: "shipping",
    label: "Shipping",
    description: "Delivery address"
  },
  {
    key: "payment",
    label: "Payment",
    description: "Payment method"
  },
  {
    key: "review",
    label: "Review",
    description: "Confirm order"
  }
];

interface CheckoutStepperProps {
  currentStep: CheckoutStep;
  completedSteps: Set<CheckoutStep>;
  className?: string;
}

export function CheckoutStepper({
  currentStep,
  completedSteps,
  className
}: CheckoutStepperProps) {
  return (
    <div className={cn("w-full py-6", className)}>
      <div className="flex items-center justify-center">
        {STEPS.map((step, index) => {
          const isCompleted = completedSteps.has(step.key);
          const isCurrent = step.key === currentStep;
          const isUpcoming = !isCompleted && !isCurrent;

          return (
            <React.Fragment key={step.key}>
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                    isCompleted && "bg-primary border-primary text-primary-foreground",
                    isCurrent && "border-primary bg-background text-primary",
                    isUpcoming && "border-muted bg-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>

                {/* Step Label */}
                <div className="mt-2 text-center">
                  <p className={cn(
                    "text-sm font-medium",
                    isCompleted && "text-primary",
                    isCurrent && "text-foreground",
                    isUpcoming && "text-muted-foreground"
                  )}>
                    {step.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {step.description}
                  </p>
                </div>
              </div>

              {/* Connector Line */}
              {index < STEPS.length - 1 && (
                <div className={cn(
                  "mx-4 h-[2px] w-16 transition-colors",
                  isCompleted ? "bg-primary" : "bg-muted"
                )} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
