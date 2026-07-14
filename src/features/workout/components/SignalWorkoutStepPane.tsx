import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { Typography } from "@/src/components/primitives";
import { cn } from "@/src/lib/cn";
import { colors } from "@/src/theme";
import { SignalWorkoutProgressHeader } from "@/src/features/workout/components/SignalWorkoutProgressHeader";
import {
  SignalWorkoutExerciseCard,
  type SignalWorkoutSetDraft,
  type SignalWorkoutStepExerciseSection,
} from "@/src/features/workout/components/SignalWorkoutExerciseCard";

type SignalCoachMediaOpenInput = {
  thumbnailUrl: string | null;
  title: string;
  url: string;
  videoId: string;
};

type SignalWorkoutStepPaneProps<TWorkoutExercise> = {
  currentStepBody: string | null;
  currentStepLabel: string | null;
  currentStepTitle: string | null;
  exercises: SignalWorkoutStepExerciseSection<TWorkoutExercise>[];
  hasStartedSession: boolean;
  isCoachInstructionsStep: boolean;
  isDoneTrainingStep: boolean;
  isExerciseBlockStep: boolean;
  isInstructionBlockStep: boolean;
  isReflectionStep: boolean;
  onAddExtraSet: (exerciseId: string) => void;
  onChangeExerciseNote: (exerciseId: string, note: string) => void;
  onChangeReflectionDurationMinutes: (value: string) => void;
  onChangeReflectionIntensity: (value: number) => void;
  onChangeReflectionNote: (value: string) => void;
  onChangeSetDraft: (draftKey: string, field: keyof SignalWorkoutSetDraft, value: string) => void;
  onCompleteSet: (exercise: TWorkoutExercise, setNumber: number) => void;
  onOpenCoachMedia: (media: SignalCoachMediaOpenInput) => void;
  onOpenDemoUrl: (url: string) => void;
  onRemoveExtraSet: (exerciseId: string) => void;
  onSetWeightInputRef: (draftKey: string, node: TextInput | null) => void;
  onToggleShareWithCoachAndTeam: () => void;
  pendingCompletedSetKeys: Set<string>;
  progress: number;
  progressIndex: number;
  progressSteps: { id: string }[];
  reflectionDurationMinutes: string;
  reflectionIntensity: number | null;
  reflectionNote: string;
  setDrafts: Record<string, SignalWorkoutSetDraft>;
  shareWithCoachAndTeam: boolean;
  signalFinishError: string | null;
  stepLabel: string;
  summaryLabel: string;
};

export function SignalWorkoutStepPane<TWorkoutExercise>({
  currentStepBody,
  currentStepLabel,
  currentStepTitle,
  exercises,
  hasStartedSession,
  isCoachInstructionsStep,
  isDoneTrainingStep,
  isExerciseBlockStep,
  isInstructionBlockStep,
  isReflectionStep,
  onAddExtraSet,
  onChangeExerciseNote,
  onChangeReflectionDurationMinutes,
  onChangeReflectionIntensity,
  onChangeReflectionNote,
  onChangeSetDraft,
  onCompleteSet,
  onOpenCoachMedia,
  onOpenDemoUrl,
  onRemoveExtraSet,
  onSetWeightInputRef,
  onToggleShareWithCoachAndTeam,
  pendingCompletedSetKeys,
  progress,
  progressIndex,
  progressSteps,
  reflectionDurationMinutes,
  reflectionIntensity,
  reflectionNote,
  setDrafts,
  shareWithCoachAndTeam,
  signalFinishError,
  stepLabel,
  summaryLabel,
}: SignalWorkoutStepPaneProps<TWorkoutExercise>) {
  return (
    <View className="gap-4">
      <SignalWorkoutProgressHeader
        progress={progress}
        progressIndex={progressIndex}
        stepLabel={stepLabel}
        steps={progressSteps}
        summaryLabel={summaryLabel}
      />

      <View className="gap-4 rounded-md border border-white/10 bg-[#101417] p-4">
        <View className="gap-1.5">
          <Typography className="tracking-[1px] opacity-75" tone="inverse" variant="labelSm">
            {isCoachInstructionsStep ? "COACH INSTRUCTIONS" : isExerciseBlockStep ? "EXERCISE BLOCK" : isInstructionBlockStep ? "BLOCK" : "STEP"}
          </Typography>
          <Typography tone="inverse" variant="headlineLg">
            {`${currentStepLabel ?? ""} ${currentStepTitle ?? "Workout"}`.trim()}
          </Typography>
          {isExerciseBlockStep ? (
            <Typography className="opacity-80" tone="inverse" variant="bodyMd">
              Scroll through the full block and log each exercise below.
            </Typography>
          ) : null}
          {!isExerciseBlockStep && currentStepBody ? (
            <Typography className="opacity-85" tone="inverse" variant="bodyMd">
              {currentStepBody}
            </Typography>
          ) : null}
        </View>

        {isCoachInstructionsStep ? (
          <Typography className="opacity-75" tone="inverse" variant="bodyMd">
            Read the coaching notes, then continue.
          </Typography>
        ) : null}

        {isInstructionBlockStep ? (
          <Typography className="opacity-75" tone="inverse" variant="bodyMd">
            Review the block details, then continue.
          </Typography>
        ) : null}

        {isExerciseBlockStep ? (
          <View className="gap-4">
            {!hasStartedSession ? (
              <Typography className="opacity-80" tone="inverse" variant="bodyMd">
                Start session to begin logging.
              </Typography>
            ) : null}

            {exercises.map((exerciseSection) => (
              <SignalWorkoutExerciseCard
                exerciseSection={exerciseSection}
                hasStartedSession={hasStartedSession}
                key={exerciseSection.exerciseKey}
                onAddExtraSet={onAddExtraSet}
                onChangeExerciseNote={onChangeExerciseNote}
                onChangeSetDraft={onChangeSetDraft}
                onCompleteSet={onCompleteSet}
                onOpenCoachMedia={onOpenCoachMedia}
                onOpenDemoUrl={onOpenDemoUrl}
                onRemoveExtraSet={onRemoveExtraSet}
                onSetWeightInputRef={onSetWeightInputRef}
                pendingCompletedSetKeys={pendingCompletedSetKeys}
                setDrafts={setDrafts}
              />
            ))}
          </View>
        ) : null}

        {isDoneTrainingStep ? (
          <View className="gap-2">
            <Typography tone="inverse" variant="headlineXl">
              Done Training
            </Typography>
            <Typography className="opacity-80" tone="inverse" variant="bodyMd">
              Great work. Review your session before finishing.
            </Typography>
          </View>
        ) : null}

        {isReflectionStep ? (
          <View className="gap-4">
            <View className="gap-2">
              <Typography className="opacity-75" tone="inverse" variant="labelSm">
                Session Reflection
              </Typography>
              <Typography tone="inverse" variant="headlineXl">
                How did this session feel?
              </Typography>
            </View>

            <View className="gap-2">
              <Typography className="opacity-75" tone="inverse" variant="labelSm">
                Intensity
              </Typography>
              <View className="flex-row flex-wrap gap-2">
                {Array.from({ length: 10 }).map((_, index) => {
                  const value = index + 1;
                  const selected = reflectionIntensity === value;
                  return (
                    <Pressable
                      key={value}
                      accessibilityRole="button"
                      className={cn(
                        "h-11 w-11 items-center justify-center rounded-full border",
                        selected ? "border-emerald bg-emerald" : "border-white/12 bg-white/6",
                      )}
                      onPress={() => onChangeReflectionIntensity(value)}
                    >
                      <Typography tone={selected ? "inverse" : "secondary"} variant="labelMd">
                        {value}
                      </Typography>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View className="gap-2">
              <Typography className="opacity-75" tone="inverse" variant="labelSm">
                Duration (minutes)
              </Typography>
              <TextInput
                keyboardType="number-pad"
                onChangeText={onChangeReflectionDurationMinutes}
                placeholder="Enter session duration"
                placeholderTextColor="rgba(255,255,255,0.42)"
                selectionColor={colors.emerald}
                style={[styles.noteInputCompact, styles.noteInputSignal]}
                value={reflectionDurationMinutes}
              />
            </View>

            <View className="gap-2">
              <Typography className="opacity-75" tone="inverse" variant="labelSm">
                Reflection
              </Typography>
              <TextInput
                multiline
                onChangeText={onChangeReflectionNote}
                placeholder="Add a quick reflection"
                placeholderTextColor="rgba(255,255,255,0.42)"
                selectionColor={colors.emerald}
                style={[styles.noteInput, styles.noteInputSignal]}
                value={reflectionNote}
              />
            </View>

            <Pressable
              accessibilityRole="checkbox"
              className="flex-row items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
              onPress={onToggleShareWithCoachAndTeam}
            >
              <Typography tone="inverse" variant="bodyMd">
                Share with coach and team
              </Typography>
              <View
                className={cn(
                  "h-6 w-6 items-center justify-center rounded-full border",
                  shareWithCoachAndTeam ? "border-emerald bg-emerald" : "border-white/15 bg-white/8",
                )}
              >
                {shareWithCoachAndTeam ? (
                  <Ionicons color={colors.white} name="checkmark" size={14} />
                ) : null}
              </View>
            </Pressable>

            {signalFinishError ? (
              <Typography tone="danger" variant="labelSm">
                {signalFinishError}
              </Typography>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  noteInputCompact: {
    borderRadius: 6,
    fontSize: 14,
    minHeight: 38,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  noteInput: {
    borderRadius: 6,
    minHeight: 64,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  noteInputSignal: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderColor: "rgba(255,255,255,0.18)",
    borderWidth: StyleSheet.hairlineWidth,
    color: colors.white,
  },
});
