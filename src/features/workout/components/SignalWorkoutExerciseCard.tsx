import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, StyleSheet, TextInput, View } from "react-native";

import { Typography } from "@/src/components/primitives";
import { cn } from "@/src/lib/cn";
import { colors } from "@/src/theme";
import { buildWorkoutLogKey } from "@/src/features/workout/lib/workoutLogIdentity";
import { SIGNAL_SET_TABLE_COLUMNS, WorkoutSetRow } from "@/src/features/workout/components/WorkoutSetRow";

export type SignalWorkoutSetDraft = {
  lbs: string;
  reps: string;
  rpe: string;
};

type SignalCoachMediaOpenInput = {
  thumbnailUrl: string | null;
  title: string;
  url: string;
  videoId: string;
};

export type SignalWorkoutStepExerciseSection<TWorkoutExercise> = {
  completedSetNumbers: Set<number>;
  demoLabel: string;
  demoThumbnailUrl: string | null;
  demoTitle: string;
  demoUrl: string;
  demoVideoId: string | null;
  exerciseId: string;
  exerciseKey: string;
  exerciseName: string;
  extraSets: number;
  label: string;
  nextSetNumber: number;
  note: string;
  notesText: string | null;
  prescribedReps: string;
  prescribedRpe: string;
  prescriptionText: string;
  targetSets: number;
  workoutExercise: TWorkoutExercise | null;
};

type SignalWorkoutExerciseCardProps<TWorkoutExercise> = {
  exerciseSection: SignalWorkoutStepExerciseSection<TWorkoutExercise>;
  hasStartedSession: boolean;
  onAddExtraSet: (exerciseId: string) => void;
  onChangeExerciseNote: (exerciseId: string, note: string) => void;
  onChangeSetDraft: (draftKey: string, field: keyof SignalWorkoutSetDraft, value: string) => void;
  onCompleteSet: (exercise: TWorkoutExercise, setNumber: number) => void;
  onOpenCoachMedia: (media: SignalCoachMediaOpenInput) => void;
  onOpenDemoUrl: (url: string) => void;
  onRemoveExtraSet: (exerciseId: string) => void;
  onSetWeightInputRef: (draftKey: string, node: TextInput | null) => void;
  pendingCompletedSetKeys: Set<string>;
  setDrafts: Record<string, SignalWorkoutSetDraft>;
};

export function SignalWorkoutExerciseCard<TWorkoutExercise>({
  exerciseSection,
  hasStartedSession,
  onAddExtraSet,
  onChangeExerciseNote,
  onChangeSetDraft,
  onCompleteSet,
  onOpenCoachMedia,
  onOpenDemoUrl,
  onRemoveExtraSet,
  onSetWeightInputRef,
  pendingCompletedSetKeys,
  setDrafts,
}: SignalWorkoutExerciseCardProps<TWorkoutExercise>) {
  return (
    <View className="gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3.5">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-1">
          <Typography tone="inverse" variant="bodyLg">
            {exerciseSection.label} {exerciseSection.exerciseName}
          </Typography>
          <Typography className="opacity-80" tone="inverse" variant="bodyMd">
            {exerciseSection.prescriptionText}
          </Typography>
          {exerciseSection.notesText ? (
            <Typography className="opacity-72" tone="inverse" variant="bodyMd">
              {exerciseSection.notesText}
            </Typography>
          ) : null}
        </View>
      </View>

      {exerciseSection.demoVideoId ? (
        <Pressable
          accessibilityRole="button"
          className="overflow-hidden rounded-lg border border-white/12 bg-white/[0.04]"
          onPress={() => {
            if (exerciseSection.demoVideoId) {
              onOpenCoachMedia({
                thumbnailUrl: exerciseSection.demoThumbnailUrl,
                title: exerciseSection.demoTitle,
                url: exerciseSection.demoUrl,
                videoId: exerciseSection.demoVideoId,
              });
              return;
            }

            onOpenDemoUrl(exerciseSection.demoUrl);
          }}
        >
          <View className="flex-row items-stretch gap-3">
            <View className="relative h-[84px] w-[132px] overflow-hidden bg-white/[0.06]">
              {exerciseSection.demoThumbnailUrl ? (
                <Image
                  source={{ uri: exerciseSection.demoThumbnailUrl }}
                  resizeMode="cover"
                  style={StyleSheet.absoluteFillObject}
                />
              ) : (
                <View className="flex-1 items-center justify-center">
                  <Ionicons color={colors.white} name="play-circle-outline" size={30} />
                </View>
              )}
              <View className="absolute inset-0 bg-black/20" />
              <View className="absolute inset-0 items-center justify-center">
                <View className="h-10 w-10 items-center justify-center rounded-full bg-black/55">
                  <Ionicons color={colors.white} name="play" size={18} />
                </View>
              </View>
            </View>
            <View className="flex-1 justify-center gap-1 pr-3">
              <Typography className="tracking-[1px] opacity-75" tone="inverse" variant="labelSm">
                COACH DEMO
              </Typography>
              <Typography numberOfLines={1} tone="inverse" variant="bodyMd">
                {exerciseSection.demoTitle}
              </Typography>
              <Typography className="opacity-72" tone="inverse" variant="labelSm">
                YouTube
              </Typography>
            </View>
            <View className="justify-center pr-3">
              <Ionicons color={colors.white} name="arrow-forward" size={16} />
            </View>
          </View>
        </Pressable>
      ) : (
        <Pressable
          accessibilityRole="button"
          className="flex-row items-center gap-3 overflow-hidden rounded-lg border border-white/12 bg-white/[0.04]"
          onPress={() => {
            onOpenDemoUrl(exerciseSection.demoUrl);
          }}
        >
          <View className="h-[72px] w-28 items-center justify-center bg-white/[0.06]">
            <Ionicons color={colors.white} name="play-circle-outline" size={28} />
          </View>
          <View className="flex-1 gap-1 pr-3">
            <Typography className="tracking-[1px] opacity-75" tone="inverse" variant="labelSm">
              DEMO
            </Typography>
            <Typography tone="inverse" variant="bodyMd">
              {exerciseSection.demoLabel}
            </Typography>
            <Typography className="opacity-72" tone="inverse" variant="labelSm">
              Search exercise form on YouTube
            </Typography>
          </View>
          <View className="pr-3">
            <Ionicons color={colors.white} name="arrow-forward" size={16} />
          </View>
        </Pressable>
      )}

      <View className="gap-2">
        <View className="flex-row items-center border-b border-white/10 pb-2">
          <Typography
            className="tracking-[1px] text-white/80"
            style={{ width: SIGNAL_SET_TABLE_COLUMNS.label }}
            tone="inverse"
            variant="labelSm"
          >
            SET
          </Typography>
          <Typography className="flex-1 text-center tracking-[1px] text-white/80" tone="inverse" variant="labelSm">
            REPS
          </Typography>
          <Typography className="flex-1 text-center tracking-[1px] text-white/80" tone="inverse" variant="labelSm">
            LBS
          </Typography>
          <Typography className="flex-1 text-center tracking-[1px] text-white/80" tone="inverse" variant="labelSm">
            RPE
          </Typography>
          <Typography
            className="text-center tracking-[1px] text-white/80"
            style={{ width: SIGNAL_SET_TABLE_COLUMNS.done }}
            tone="inverse"
            variant="labelSm"
          >
            DONE
          </Typography>
        </View>

        {Array.from({ length: exerciseSection.targetSets + exerciseSection.extraSets }).map((_, index) => {
          const setNo = index + 1;
          const draftKey = buildWorkoutLogKey(exerciseSection.exerciseId, setNo);
          const completed =
            exerciseSection.completedSetNumbers.has(setNo) ||
            pendingCompletedSetKeys.has(draftKey);
          const isActiveSet =
            hasStartedSession &&
            setNo === exerciseSection.nextSetNumber &&
            exerciseSection.completedSetNumbers.size < (exerciseSection.targetSets + exerciseSection.extraSets);
          const draft = setDrafts[draftKey] ?? { lbs: "", reps: "", rpe: "" };
          const displayedReps = draft.reps.length > 0 ? draft.reps : exerciseSection.prescribedReps;
          const displayedRpe = draft.rpe.length > 0 ? draft.rpe : exerciseSection.prescribedRpe;
          return (
            <WorkoutSetRow
              completed={completed}
              index={setNo}
              isActive={isActiveSet}
              isEditable={hasStartedSession && Boolean(exerciseSection.workoutExercise)}
              key={draftKey}
              lbsValue={draft.lbs}
              onChangeLbs={(next) => onChangeSetDraft(draftKey, "lbs", next)}
              onChangeReps={(next) => onChangeSetDraft(draftKey, "reps", next)}
              onChangeRpe={(next) => onChangeSetDraft(draftKey, "rpe", next)}
              onToggleComplete={() => {
                if (!exerciseSection.workoutExercise) return;
                onCompleteSet(exerciseSection.workoutExercise, setNo);
              }}
              repsValue={displayedReps}
              rpeValue={displayedRpe}
              setLabel={`Set ${setNo}`}
              signalMode
              weightInputRef={(node) => {
                onSetWeightInputRef(draftKey, node);
              }}
            />
          );
        })}

        {hasStartedSession ? (
          <View className="flex-row items-center justify-center gap-4 pt-2 pb-1">
            <Pressable
              accessibilityLabel="Remove set"
              accessibilityRole="button"
              disabled={exerciseSection.extraSets === 0}
              onPress={() => {
                const lastSetNo = exerciseSection.targetSets + exerciseSection.extraSets;
                const isLastSetCompleted = exerciseSection.completedSetNumbers.has(lastSetNo) || pendingCompletedSetKeys.has(buildWorkoutLogKey(exerciseSection.exerciseId, lastSetNo));
                if (isLastSetCompleted) return; // Prevent removing completed set
                onRemoveExtraSet(exerciseSection.exerciseId);
              }}
              className={cn(
                "h-8 w-8 items-center justify-center rounded-full border",
                exerciseSection.extraSets > 0 && !exerciseSection.completedSetNumbers.has(exerciseSection.targetSets + exerciseSection.extraSets) && !pendingCompletedSetKeys.has(buildWorkoutLogKey(exerciseSection.exerciseId, exerciseSection.targetSets + exerciseSection.extraSets))
                  ? "border-white/20 bg-white/10"
                  : "border-white/5 bg-transparent opacity-40",
              )}
            >
              <Ionicons color={colors.white} name="remove" size={16} />
            </Pressable>
            <Typography className="tracking-[1px] opacity-75" tone="inverse" variant="labelSm">
              SET
            </Typography>
            <Pressable
              accessibilityLabel="Add set"
              accessibilityRole="button"
              onPress={() => onAddExtraSet(exerciseSection.exerciseId)}
              className="h-8 w-8 items-center justify-center rounded-full border border-emerald/50 bg-emerald/20"
            >
              <Ionicons color={colors.emerald} name="add" size={16} />
            </Pressable>
          </View>
        ) : null}
      </View>

      <View className="gap-1.5">
        <Typography className="tracking-[1px] opacity-90" tone="inverse" variant="labelSm">
          NOTE
        </Typography>
        <TextInput
          editable={hasStartedSession}
          onChangeText={(next) => onChangeExerciseNote(exerciseSection.exerciseId, next)}
          placeholder="Add a quick note"
          placeholderTextColor="rgba(255,255,255,0.42)"
          selectionColor={colors.emerald}
          style={[styles.noteInputCompact, styles.noteInputSignal]}
          value={exerciseSection.note}
        />
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
  noteInputSignal: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderColor: "rgba(255,255,255,0.18)",
    borderWidth: StyleSheet.hairlineWidth,
    color: colors.white,
  },
});
