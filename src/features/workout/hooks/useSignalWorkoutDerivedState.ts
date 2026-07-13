import { useMemo } from "react";

type SignalWorkoutStepLike = {
  blockIndex?: number;
  body?: string;
  id: string;
  label: string;
  title: string;
  type: string;
};

type UseSignalWorkoutDerivedStateInput<TStep extends SignalWorkoutStepLike> = {
  currentStepIndex: number;
  isSignalExecution: boolean;
  signalOrderedSteps: TStep[];
};

export function useSignalWorkoutDerivedState<TStep extends SignalWorkoutStepLike>({
  currentStepIndex,
  isSignalExecution,
  signalOrderedSteps,
}: UseSignalWorkoutDerivedStateInput<TStep>) {
  const safeStepIndex = Math.min(currentStepIndex, Math.max(0, signalOrderedSteps.length - 1));
  const currentStep = signalOrderedSteps[safeStepIndex] ?? null;
  const currentStepType = currentStep?.type ?? null;
  const currentStepLabel = currentStep?.label ?? null;
  const currentStepTitle = currentStep?.title ?? null;
  const currentStepBody = currentStep?.body ?? null;

  const signalProgressSteps = useMemo(
    () => signalOrderedSteps.filter((step) => step.type !== "reflection" && step.type !== "summary"),
    [signalOrderedSteps],
  );

  const signalProgressStepIds = useMemo(
    () => signalProgressSteps.map((step) => step.id),
    [signalProgressSteps],
  );

  const signalProgressIndex = useMemo(() => {
    if (!currentStep) return 0;
    const explicitIndex = signalProgressStepIds.indexOf(currentStep.id);
    if (explicitIndex >= 0) return explicitIndex;
    return Math.max(0, signalProgressSteps.length - 1);
  }, [currentStep, signalProgressStepIds, signalProgressSteps.length]);

  const isCoachInstructionsStep = currentStepType === "coach_instructions";
  const isInstructionBlockStep = currentStepType === "instruction_block";
  const isExerciseBlockStep = currentStepType === "exercise_block";
  const isDoneTrainingStep = currentStepType === "done_training";
  const isReflectionStep = currentStepType === "reflection";
  const isSummaryStep = currentStepType === "summary";
  const isWorkoutProgressStep = isCoachInstructionsStep || isInstructionBlockStep || isExerciseBlockStep;
  const canGoToPreviousSignalStep = Boolean(isSignalExecution && safeStepIndex > 0);
  const signalStepCount = signalProgressSteps.length;
  const signalStepProgress =
    signalStepCount > 0 ? Math.min(signalProgressIndex + 1, signalStepCount) / signalStepCount : 0;

  const signalWorkoutStepLines = useMemo(
    () =>
      signalOrderedSteps.map((step) => {
        switch (step.type) {
          case "coach_instructions":
            return "Coach Instructions";
          case "instruction_block":
            return `${step.label} ${step.title}`;
          case "exercise_block":
            return `${step.label} ${step.title}`;
          case "done_training":
            return "Done Training";
          case "reflection":
            return "Reflection";
          case "summary":
            return "Summary";
          default:
            return `${step.label} ${step.title}`;
        }
      }),
    [signalOrderedSteps],
  );

  const signalWorkoutBlockCount = useMemo(() => {
    const uniqueBlocks = new Set(
      signalProgressSteps
        .filter((step) => step.blockIndex != null)
        .map((step) => step.blockIndex),
    );
    return uniqueBlocks.size;
  }, [signalProgressSteps]);

  return {
    canGoToPreviousSignalStep,
    currentStep,
    currentStepBody,
    currentStepLabel,
    currentStepTitle,
    currentStepType,
    isCoachInstructionsStep,
    isDoneTrainingStep,
    isExerciseBlockStep,
    isInstructionBlockStep,
    isReflectionStep,
    isSummaryStep,
    isWorkoutProgressStep,
    safeStepIndex,
    signalProgressIndex,
    signalProgressSteps,
    signalStepCount,
    signalStepProgress,
    signalWorkoutBlockCount,
    signalWorkoutStepLines,
  };
}
