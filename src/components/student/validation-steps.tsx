"use client";

import { VALIDATION_STEPS } from "@/lib/constants";
import { Check, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ValidationStepsProps {
  currentStep: number;
}

export function ValidationSteps({ currentStep }: ValidationStepsProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {VALIDATION_STEPS.map((step, index) => {
          const isCompleted = currentStep > step.step;
          const isCurrent = currentStep === step.step;
          const isPending = currentStep < step.step;

          return (
            <div key={step.step} className="flex flex-col items-center flex-1">
              <div className="flex items-center w-full">
                {/* Ligne avant */}
                {index > 0 && (
                  <div
                    className={cn(
                      "h-1 flex-1",
                      isCompleted || isCurrent ? "bg-green-500" : "bg-gray-200"
                    )}
                  />
                )}

                {/* Cercle */}
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                    isCompleted && "bg-green-500 border-green-500 text-white",
                    isCurrent && "bg-blue-500 border-blue-500 text-white",
                    isPending && "bg-white border-gray-300 text-gray-400"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : isCurrent ? (
                    <Clock className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-medium">{step.step + 1}</span>
                  )}
                </div>

                {/* Ligne après */}
                {index < VALIDATION_STEPS.length - 1 && (
                  <div
                    className={cn(
                      "h-1 flex-1",
                      isCompleted ? "bg-green-500" : "bg-gray-200"
                    )}
                  />
                )}
              </div>

              {/* Label */}
              <div className="mt-2 text-center">
                <p
                  className={cn(
                    "text-xs font-medium",
                    isCompleted && "text-green-600",
                    isCurrent && "text-blue-600",
                    isPending && "text-gray-400"
                  )}
                >
                  {step.title}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
