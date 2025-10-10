"use client";

import { useState, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type WizardStep = {
  id: string;
  title: string;
  description: string;
  content: ReactNode;
  onNext?: () => boolean | Promise<boolean>; // Return false to prevent navigation
};

type GenerationWizardProps = {
  steps: WizardStep[];
  onComplete?: () => void;
  onCancel?: () => void;
};

export default function GenerationWizard({
  steps,
  onComplete,
  onCancel,
}: GenerationWizardProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const currentStep = steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  const handleNext = async () => {
    // Call step's onNext if it exists
    if (currentStep.onNext) {
      const canProceed = await currentStep.onNext();
      if (!canProceed) return;
    }

    if (isLastStep) {
      onComplete?.();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const goToStep = (index: number) => {
    if (index >= 0 && index < steps.length) {
      setCurrentStepIndex(index);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Progress Indicator */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className="flex items-center flex-1"
            >
              <button
                onClick={() => index < currentStepIndex && goToStep(index)}
                disabled={index > currentStepIndex}
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-all duration-300 ${
                  index === currentStepIndex
                    ? "bg-primary text-primary-foreground scale-110"
                    : index < currentStepIndex
                    ? "bg-primary/80 text-primary-foreground cursor-pointer hover:bg-primary"
                    : "bg-gray-200 dark:bg-gray-700 text-muted-foreground"
                }`}
              >
                {index + 1}
              </button>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-2 rounded transition-all duration-500 ${
                    index < currentStepIndex
                      ? "bg-primary"
                      : "bg-gray-200 dark:bg-gray-700"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="text-sm text-muted-foreground transition-colors duration-500">
          Step {currentStepIndex + 1} of {steps.length}
        </div>
      </div>

      {/* Step Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold transition-colors duration-500">
          {currentStep.title}
        </h2>
        <p className="text-muted-foreground mt-1 transition-colors duration-500">
          {currentStep.description}
        </p>
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-auto mb-6">
        {currentStep.content}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button
          variant="outline"
          onClick={isFirstStep ? onCancel : handleBack}
          className="transition-all duration-300"
        >
          {isFirstStep ? (
            "Cancel"
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </>
          )}
        </Button>
        <Button
          onClick={handleNext}
          className="transition-all duration-300"
        >
          {isLastStep ? (
            "Complete"
          ) : (
            <>
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

