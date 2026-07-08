import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Link, router, useLocalSearchParams } from "expo-router";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Image, Linking, Modal, Pressable, StyleSheet, TextInput, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

import { AppTopBar, EditorialCard, ProgressBar, ScreenScaffold } from "@/src/components/layout";
import { AppButton, GlassCard, Typography } from "@/src/components/primitives";
import { useAdvanceActiveProgramAfterWorkout, useCompleteSet, useFinishWorkout, useDiscardWorkoutSession } from "@/src/hooks/mutations";
import { useActiveProgram, useEnrollments, useWorkout, useWorkoutSession } from "@/src/hooks/queries";
import { queryKeys } from "@/src/hooks/queries/queryKeys";
import { useAuth } from "@/src/hooks/useAuth";
import { useRestTimer } from "@/src/hooks/useRestTimer";
import { useWorkoutProgram } from "@/src/hooks/useWorkoutProgram";
import { workoutService } from "@/src/services";
import { cn } from "@/src/lib/cn";
import {
  buildYouTubeEmbedUrl,
  buildYouTubeThumbnailUrl,
  buildYouTubeWatchUrl,
  parseYouTubeVideoId,
} from "@/src/lib/youtube-media";
import type { WorkoutExercise, WorkoutLogSet } from "@/src/services/workout.service";
import {
  buildSignalWorkoutExecutionContext,
  buildSignalWorkoutSteps,
  formatSignalExercisePrescription,
  hasSignalWorkoutPayload,
  findNextSignalWorkoutDay,
  getSignalExerciseLabel,
  resolveSignalWorkoutInitialStepIndex,
  resolveSignalWorkoutSelection,
} from "@/src/services/signal-workout-adapter";
import { colors, spacing } from "@/src/theme";

const SIGNAL_WORKOUT_HOME_HREF = "/(tabs)/workouts" as const;
const SIGNAL_SET_TABLE_COLUMNS = {
  done: 48,
  label: 40,
} as const;

type SignalCoachMediaPreview = {
  thumbnailUrl: string | null;
  title: string;
  url: string | null;
  videoId: string | null;
};

function SignalFooterSecondaryButton({
  children,
  disabled,
  onPress,
}: {
  children: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      className={cn(
        "min-h-12 flex-row items-center justify-center rounded-lg border border-white/12 bg-white/[0.03] px-3",
        disabled ? "opacity-45" : "active:bg-white/[0.06]",
      )}
      disabled={disabled}
      onPress={onPress}
    >
      <Typography align="center" tone="inverse" variant="labelSm">
        {children}
      </Typography>
    </Pressable>
  );
}

function SignalFooterPrimaryButton({
  children,
  disabled,
  isLoading,
  onPress,
}: {
  children: string;
  disabled?: boolean;
  isLoading?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      className={cn(
        "min-h-12 flex-row items-center justify-center rounded-lg px-3",
        disabled || isLoading ? "opacity-50" : "active:opacity-90",
      )}
      disabled={disabled || isLoading}
      onPress={onPress}
      style={{
        backgroundColor: colors.emerald,
        borderColor: colors.emerald,
        borderWidth: StyleSheet.hairlineWidth,
      }}
    >
      {isLoading ? <ActivityIndicator color={colors.white} /> : null}
      <Typography align="center" tone="inverse" variant="labelSm">
        {children}
      </Typography>
    </Pressable>
  );
}

function SignalFooterTimerButton({
  children,
  onPress,
}: {
  children: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      className="min-h-12 flex-row items-center justify-center gap-2 rounded-lg border border-emerald/35 bg-emerald/10 px-4 active:bg-emerald/15"
      onPress={onPress}
    >
      <Ionicons color={colors.white} name="timer-outline" size={16} />
      <Typography align="center" tone="inverse" variant="labelMd">
        {children}
      </Typography>
    </Pressable>
  );
}

function parseTargetReps(raw: string | null) {
  if (!raw) return null;
  const match = raw.match(/\d+/);
  if (!match) return null;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

function singleParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function parseIndexParam(value: string | string[] | undefined) {
  const raw = singleParam(value);
  if (!raw) return null;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function isValidHttpUrl(value: string | null | undefined) {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

function getProgramsErrorCode(error: unknown) {
  return error instanceof Error ? (error as { code?: string }).code ?? null : null;
}

type WorkoutCompletionSummary = {
  completedDayTitle: string;
  completedExercises: number;
  completedSets: number;
  completedWeekLabel: string;
  isProgramCompleted: boolean;
  nextWorkout: {
    dayId: string;
    dayLabel: string;
    programId: string;
    weekId: string;
    weekLabel: string;
  } | null;
  progressUpdateNeedsRefresh: boolean;
  programTitle: string;
};

function isMatchingSignalActiveProgram(
  activeProgram:
    | {
        current_day_key: string | null;
        current_week_key: string | null;
        source: "legacy" | "signal";
        source_program_id: string;
      }
    | null,
  programId: string | null,
  weekId: string | null,
  dayId: string | null,
) {
  return Boolean(
    activeProgram &&
      activeProgram.source === "signal" &&
      activeProgram.source_program_id === programId,
  );
}

function logSignalPointerMismatch(context: Record<string, unknown>) {
  if (__DEV__) {
    console.warn("[signal-workout-session]", "Active Signal program validation failed", context);
  }
}

function formatSignalWorkoutPrescriptionSummary(
  prescription: WorkoutExercise["prescription"] | null | undefined,
) {
  if (!prescription) return null;

  const summary = [
    prescription.target_sets ? `${prescription.target_sets} sets` : null,
    prescription.target_reps ? `${prescription.target_reps} reps` : null,
    prescription.target_rpe ? `RPE ${prescription.target_rpe}` : null,
    prescription.rest_seconds ? `${prescription.rest_seconds}s rest` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return summary.length > 0 ? summary : null;
}

function parseSignalFallbackSetCount(exercise: WorkoutExercise | null | undefined) {
  const explicitSets = exercise?.prescription.target_sets ?? 0;
  if (explicitSets > 0) return explicitSets;

  const repsText = exercise?.prescription.target_reps?.trim() ?? "";
  if (!repsText) return 1;

  const xMatch = repsText.match(/(\d+)\s*(?:x|×)\s*(\d+)/i);
  if (xMatch) {
    const parsed = Number(xMatch[1]);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }

  const setsMatch = repsText.match(/(\d+)\s*(?:sets?|rounds?|working sets?)/i);
  if (setsMatch) {
    const parsed = Number(setsMatch[1]);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }

  return 1;
}

function getSignalFallbackReps(exercise: WorkoutExercise | null | undefined) {
  const repsText = exercise?.prescription.target_reps?.trim() ?? "";
  if (!repsText) return null;

  const xMatch = repsText.match(/(\d+)\s*(?:x|×)\s*(\d+)/i);
  if (xMatch) {
    const parsed = Number(xMatch[2]);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }

  return parseTargetReps(repsText);
}

function buildSignalDemoSearchUrl(exerciseName: string) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${exerciseName} exercise form`)}`;
}

function getSignalCoachMediaPreview(workoutExercise: WorkoutExercise | null | undefined, exerciseName: string): SignalCoachMediaPreview | null {
  if (!workoutExercise) return null;

  const library = workoutExercise.exercise;
  const mediaItems = Array.isArray(library.media_items) ? library.media_items : [];
  const firstMedia = mediaItems[0] ?? null;
  const fallbackVideoId = firstMedia?.videoId ?? parseYouTubeVideoId(library.video_url);

  if (!firstMedia && !fallbackVideoId && !library.video_url) {
    return null;
  }

  return {
    thumbnailUrl: firstMedia?.thumbnailUrl ?? (fallbackVideoId ? buildYouTubeThumbnailUrl(fallbackVideoId) : null),
    title: firstMedia?.title?.trim() || library.video_title?.trim() || exerciseName,
    url: firstMedia?.url ?? (fallbackVideoId ? buildYouTubeWatchUrl(fallbackVideoId) : library.video_url),
    videoId: firstMedia?.videoId ?? fallbackVideoId,
  };
}

function lbsToKg(lbs: number) {
  return lbs * 0.45359237;
}

function kgToLbs(kg: number) {
  return kg / 0.45359237;
}

function buildWorkoutLogKey(exerciseIdentityKey: string, setNumber: number) {
  return `${exerciseIdentityKey}:${setNumber}`;
}

function getWorkoutExerciseIdentityKey(exercise: WorkoutExercise) {
  return exercise.source_exercise_key ?? exercise.exercise.id;
}

function getWorkoutLogIdentityKey(log: Pick<WorkoutLogSet, "exercise_library_id" | "source_exercise_key">) {
  return log.source_exercise_key ?? log.exercise_library_id ?? "";
}

function normalizeCompletedSetPayload(input: {
  draft: { lbs: string; reps: string; rpe: string };
  exercise: WorkoutExercise;
  isSignalWorkout: boolean;
  setNumber: number;
}) {
  const repsCompletedRaw = input.draft.reps.trim() ? Number(input.draft.reps) : getSignalFallbackReps(input.exercise);
  const rpeActualRaw = input.draft.rpe.trim() ? Number(input.draft.rpe) : null;
  const weightLbsRaw = input.draft.lbs.trim() ? Number(input.draft.lbs) : NaN;
  const repsCompleted = Number.isFinite(repsCompletedRaw as number) ? (repsCompletedRaw as number) : null;
  const rpeActualValue = Number.isFinite(rpeActualRaw as number) ? (rpeActualRaw as number) : null;
  const rpeActual =
    rpeActualValue != null && rpeActualValue >= 1 && rpeActualValue <= 10 ? rpeActualValue : null;
  const weightKg = Number.isFinite(weightLbsRaw) ? lbsToKg(weightLbsRaw) : null;
  const exerciseIdentityKey = getWorkoutExerciseIdentityKey(input.exercise);

  return {
    exerciseLibraryId: input.isSignalWorkout ? null : exerciseIdentityKey,
    exerciseName: input.isSignalWorkout ? input.exercise.exercise.name : null,
    repsCompleted,
    rpeActual,
    setNumber: input.setNumber,
    sourceExerciseKey: input.isSignalWorkout ? exerciseIdentityKey : null,
    weightKg,
  };
}

function WorkoutSkeleton() {
  return (
    <View className="gap-gutter">
      <EditorialCard className="min-h-44 bg-surface-muted" />
      <EditorialCard className="min-h-40 bg-surface-muted" />
      <EditorialCard className="min-h-56 bg-surface-muted" />
    </View>
  );
}

function getTargetSets(exercise: WorkoutExercise | null | undefined) {
  return parseSignalFallbackSetCount(exercise);
}

function parsePositiveIntegerLike(value: string | number | null | undefined) {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : null;
  }

  if (typeof value !== "string") return null;
  const match = value.trim().match(/\d+/);
  if (!match) return null;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function getSignalPrescribedSetCount(
  exercise: WorkoutExercise | null | undefined,
  payloadExercise: { sets?: string | number | null } | null | undefined,
) {
  const payloadSets = parsePositiveIntegerLike(payloadExercise?.sets);
  if (payloadSets) return payloadSets;

  const targetSets = getTargetSets(exercise);
  return targetSets > 0 ? targetSets : 1;
}

function getSignalPrescribedRepsValue(
  exercise: WorkoutExercise | null | undefined,
  payloadExercise: { reps?: string | null } | null | undefined,
) {
  const payloadReps = typeof payloadExercise?.reps === "string" ? payloadExercise.reps.trim() : "";
  if (payloadReps) return payloadReps;

  const repsFallback = getSignalFallbackReps(exercise);
  return Number.isFinite(repsFallback as number) ? String(repsFallback) : "";
}

function getSignalPrescribedRpeValue(
  exercise: WorkoutExercise | null | undefined,
  payloadExercise: { rpe?: string | null } | null | undefined,
) {
  const payloadRpe = typeof payloadExercise?.rpe === "string" ? payloadExercise.rpe.trim() : "";
  if (payloadRpe) return payloadRpe;

  const targetRpe = exercise?.prescription.target_rpe;
  if (typeof targetRpe === "number" && Number.isFinite(targetRpe)) return String(targetRpe);
  return "";
}

function SetRowVariantD({
  completed,
  index,
  isActive,
  lbsValue,
  repsValue,
  rpeValue,
  setLabel,
  onChangeLbs,
  onChangeReps,
  onChangeRpe,
  onToggleComplete,
  isEditable = true,
  signalMode,
  weightInputRef,
}: {
  completed: boolean;
  index: number;
  isActive: boolean;
  lbsValue: string;
  repsValue: string;
  rpeValue: string;
  setLabel: string;
  onChangeLbs: (next: string) => void;
  onChangeReps: (next: string) => void;
  onChangeRpe: (next: string) => void;
  onToggleComplete: () => void;
  isEditable?: boolean;
  signalMode?: boolean;
  weightInputRef?: (node: TextInput | null) => void;
}) {
  const isEnabled = isEditable && !completed;
  const cardTone = completed
    ? signalMode
      ? "opacity-60"
      : "opacity-70"
      : isActive
      ? signalMode
        ? "bg-white/[0.03]"
        : "bg-white/90 border-white shadow-luxury"
      : signalMode
        ? ""
        : "bg-white/60 border-white/70";

  const indicator = isActive ? (
    <View className={`absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full ${signalMode ? "bg-emerald" : "bg-graphite"}`} />
  ) : null;

  return signalMode ? (
    <View
      className={cn(
        "relative flex-row items-center gap-2 border-b border-white/10 py-2.5",
        completed ? "bg-emerald/8" : isActive ? "bg-white/[0.04]" : "bg-transparent",
        !isEditable ? "opacity-70" : "",
      )}
    >
      {indicator}
      <View className="items-center justify-center pr-1" style={{ width: SIGNAL_SET_TABLE_COLUMNS.label }}>
        <Typography tone={completed ? "accent" : "inverse"} variant="bodyLg">
          {index}
        </Typography>
      </View>
      <View className="flex-1">
        <View
          className={cn(
            "h-10 items-center justify-center rounded-sm border px-1.5",
            completed
              ? "border-emerald/40 bg-emerald/12"
              : isActive
                ? "border-emerald/40 bg-white/[0.04]"
                : "border-white/10 bg-transparent",
          )}
        >
          <TextInput
            editable={isEnabled}
            keyboardType="numeric"
            onChangeText={onChangeReps}
            placeholder="-"
            placeholderTextColor="rgba(255,255,255,0.62)"
            selectionColor={colors.emerald}
            style={[
              styles.setFieldInput,
              styles.setFieldInputSignal,
              completed ? styles.setFieldInputCompleted : null,
              isActive ? styles.setFieldInputActive : null,
            ]}
            value={repsValue}
          />
        </View>
      </View>
      <View className="flex-1">
        <View
          className={cn(
            "h-10 items-center justify-center rounded-sm border px-1.5",
            completed
              ? "border-emerald/40 bg-emerald/12"
              : isActive
                ? "border-emerald/40 bg-white/[0.04]"
                : "border-white/10 bg-transparent",
          )}
        >
          <TextInput
            editable={isEnabled}
            keyboardType="numeric"
            onChangeText={onChangeLbs}
            placeholder="-"
            placeholderTextColor="rgba(255,255,255,0.62)"
            ref={weightInputRef}
            selectionColor={colors.emerald}
            style={[
              styles.setFieldInput,
              styles.setFieldInputSignal,
              completed ? styles.setFieldInputCompleted : null,
              isActive ? styles.setFieldInputActive : null,
            ]}
            value={lbsValue}
          />
        </View>
      </View>
      <View className="flex-1">
        <View
          className={cn(
            "h-10 items-center justify-center rounded-sm border px-1.5",
            completed
              ? "border-emerald/40 bg-emerald/12"
              : isActive
                ? "border-emerald/40 bg-white/[0.04]"
                : "border-white/10 bg-transparent",
          )}
        >
          <TextInput
            editable={isEnabled}
            keyboardType="numeric"
            onChangeText={onChangeRpe}
            placeholder="-"
            placeholderTextColor="rgba(255,255,255,0.62)"
            selectionColor={colors.emerald}
            style={[
              styles.setFieldInput,
              styles.setFieldInputSignal,
              completed ? styles.setFieldInputCompleted : null,
              isActive ? styles.setFieldInputActive : null,
            ]}
            value={rpeValue}
          />
        </View>
      </View>
      <View className="items-center justify-center" style={{ width: SIGNAL_SET_TABLE_COLUMNS.done }}>
        <Pressable
          accessibilityLabel={completed ? "Set complete" : "Mark set complete"}
          accessibilityRole="button"
          className={cn(
            "h-10 w-10 items-center justify-center rounded-md border",
            completed
              ? "border-emerald bg-emerald"
              : isEnabled && isActive
                ? "border-white/30 bg-white/[0.08]"
                : "border-white/12 bg-white/[0.03] opacity-70",
          )}
          disabled={!isEnabled || !isActive}
          hitSlop={8}
          onPress={onToggleComplete}
        >
          <Ionicons color={colors.white} name={completed ? "checkmark-circle" : "checkmark"} size={15} />
        </Pressable>
      </View>
    </View>
  ) : (
    <GlassCard className={`relative overflow-hidden rounded-2xl border p-4 ${cardTone}`}>
      {indicator}
      <View className={isActive ? "flex-row items-center justify-between gap-3 pl-3" : "flex-row items-center justify-between gap-3"}>
        <View className="flex-row items-center gap-4">
          <Typography tone="secondary" variant="headlineLg">
            {index}
          </Typography>
          <Typography className="uppercase tracking-widest" tone="secondary" variant="labelSm">
            {setLabel}
          </Typography>
        </View>

        <View className="flex-row items-center gap-6">
          <TextInput
            editable={isEditable && !completed}
            keyboardType="numeric"
            onChangeText={onChangeReps}
            placeholder="-"
            placeholderTextColor={signalMode ? "rgba(255,255,255,0.35)" : colors.graphiteSubtle}
            selectionColor={colors.emerald}
            style={[
              styles.setInput,
              signalMode ? styles.setInputSignal : null,
              completed ? styles.setInputCompleted : null,
              isActive ? styles.setInputActive : null,
            ]}
            value={repsValue}
          />
          <TextInput
            editable={isEditable && !completed}
            keyboardType="numeric"
            onChangeText={onChangeLbs}
            placeholder="-"
            placeholderTextColor={signalMode ? "rgba(255,255,255,0.35)" : colors.graphiteSubtle}
            ref={weightInputRef}
            selectionColor={colors.emerald}
            style={[
              styles.setInput,
              signalMode ? styles.setInputSignal : null,
              completed ? styles.setInputCompleted : null,
              isActive ? styles.setInputActive : null,
            ]}
            value={lbsValue}
          />
          <TextInput
            editable={isEditable && !completed}
            keyboardType="numeric"
            onChangeText={onChangeRpe}
            placeholder="-"
            placeholderTextColor={signalMode ? "rgba(255,255,255,0.35)" : colors.graphiteSubtle}
            selectionColor={colors.emerald}
            style={[
              styles.setInput,
              signalMode ? styles.setInputSignal : null,
              completed ? styles.setInputCompleted : null,
              isActive ? styles.setInputActive : null,
            ]}
            value={rpeValue}
          />

          <Pressable
            accessibilityLabel={completed ? "Set complete" : "Mark set complete"}
            accessibilityRole="button"
            className={
              completed
                ? "h-10 w-10 items-center justify-center rounded-full bg-emerald"
                : isActive
                  ? signalMode
                    ? "h-10 w-10 items-center justify-center rounded-full border-2 border-white/20 bg-white/10"
                    : "h-9 w-9 items-center justify-center rounded-full border-2 border-border bg-white/50"
                  : signalMode
                    ? "h-10 w-10 items-center justify-center rounded-full border-2 border-white/10 bg-white/5 opacity-60"
                    : "h-9 w-9 items-center justify-center rounded-full border-2 border-border/50 bg-transparent opacity-60"
            }
            disabled={completed || !isActive || !isEditable}
            hitSlop={8}
            onPress={onToggleComplete}
          >
            <Ionicons color={completed ? colors.white : signalMode ? colors.white : colors.graphiteMuted} name="checkmark" size={16} />
          </Pressable>
        </View>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  signalHeaderWrap: {
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 20,
  },
  noteInputCompact: {
    borderRadius: 6,
    fontSize: 14,
    minHeight: 38,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  setFieldInput: {
    fontSize: 14,
    fontFamily: "Manrope_600SemiBold",
    height: 22,
    includeFontPadding: false,
    lineHeight: 18,
    paddingHorizontal: 0,
    paddingVertical: 0,
    textAlign: "center",
    textAlignVertical: "center",
    width: "100%",
  },
  setFieldInputActive: {
    color: colors.white,
  },
  setFieldInputCompleted: {
    color: "rgba(255,255,255,0.85)",
  },
  setFieldInputSignal: {
    color: colors.white,
  },
  setInput: {
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    color: colors.graphite,
    minWidth: 56,
    paddingBottom: 4,
    textAlign: "center",
  },
  setInputActive: {
    borderBottomColor: colors.graphite,
    borderBottomWidth: 2,
  },
  setInputCompleted: {
    borderBottomColor: colors.border,
    color: colors.graphiteMuted,
  },
  setInputSignal: {
    borderBottomColor: "rgba(255,255,255,0.24)",
    color: colors.white,
  },
  setInputSignalActive: {
    borderBottomColor: colors.emerald,
    borderBottomWidth: 2,
    color: colors.white,
  },
  setInputSignalCompleted: {
    borderBottomColor: "rgba(255,255,255,0.18)",
    color: "rgba(255,255,255,0.72)",
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

function WorkoutPlayerScreenComponent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    signalBlockIndex?: string;
    signalExerciseIndex?: string;
    signalDayId?: string;
    signalProgramId?: string;
    signalStepType?: string;
    signalWeekId?: string;
  }>();
  const signalProgramId = singleParam(params.signalProgramId);
  const signalWeekId = singleParam(params.signalWeekId);
  const signalDayId = singleParam(params.signalDayId);
  const signalStepType = singleParam(params.signalStepType);
  const initialSignalBlockIndex = parseIndexParam(params.signalBlockIndex);
  const initialSignalExerciseIndex = parseIndexParam(params.signalExerciseIndex);
  const hasSignalRouteParams = Boolean(signalProgramId || signalWeekId || signalDayId);
  const isSignalExecution = hasSignalRouteParams;

  const enrollmentsQuery = useEnrollments();
  const activeProgramQuery = useActiveProgram(isSignalExecution ? user?.id : undefined);
  const activeProgram = activeProgramQuery.data ?? null;
  const workoutQuery = useWorkout({ enabled: !isSignalExecution });
  const signalProgramVersionId =
    isSignalExecution && activeProgram?.source === "signal" && activeProgram.source_program_id === signalProgramId
      ? activeProgram.source_program_version ?? null
      : null;
  const signalWorkoutQuery = useWorkoutProgram(signalProgramId, signalProgramVersionId);
  const signalWorkoutPayload = useMemo(
    () => (hasSignalWorkoutPayload(signalWorkoutQuery.data) ? signalWorkoutQuery.data : null),
    [signalWorkoutQuery.data],
  );
  const signalWorkoutSelection = useMemo(
    () =>
      signalWorkoutPayload
        ? resolveSignalWorkoutSelection(signalWorkoutPayload, { dayId: signalDayId, weekId: signalWeekId })
        : null,
    [signalDayId, signalWeekId, signalWorkoutPayload],
  );
  const signalOrderedSteps = useMemo(
    () => buildSignalWorkoutSteps(signalWorkoutSelection?.day ?? null),
    [signalWorkoutSelection?.day],
  );
  const signalInitialStepIndex = useMemo(
    () =>
      resolveSignalWorkoutInitialStepIndex(signalOrderedSteps, {
        blockIndex: initialSignalBlockIndex,
        exerciseIndex: initialSignalExerciseIndex,
        stepType: signalStepType,
      }),
    [initialSignalBlockIndex, initialSignalExerciseIndex, signalOrderedSteps, signalStepType],
  );
  const isActiveProgramLoading = isSignalExecution && activeProgramQuery.isLoading;
  const signalActiveProgramIsValid = isMatchingSignalActiveProgram(
    activeProgram,
    signalProgramId,
    signalWeekId,
    signalDayId,
  );
  useEffect(() => {
    if (!isSignalExecution || signalActiveProgramIsValid || !activeProgram) return;

    logSignalPointerMismatch({
      activeProgramId: activeProgram.id,
      activeProgramSourceProgramId: activeProgram.source_program_id,
      routeSignalProgramId: signalProgramId,
    });
  }, [
    activeProgram,
    isSignalExecution,
    signalActiveProgramIsValid,
    signalDayId,
    signalProgramId,
    signalWeekId,
  ]);
  useEffect(() => {
    if (__DEV__ && isSignalExecution && signalProgramVersionId == null) {
      console.warn("[SignalProgram] active program has no source_program_version; using latest fallback");
    }
  }, [isSignalExecution, signalProgramVersionId]);
  const signalWorkoutPlan = useMemo(() => {
    if (
      !isSignalExecution ||
      !user?.id ||
      !signalWorkoutPayload ||
      signalWorkoutSelection?.status !== "ok" ||
      !signalActiveProgramIsValid
    ) {
      return null;
    }
    return buildSignalWorkoutExecutionContext(
      signalWorkoutPayload,
      { dayId: signalDayId, weekId: signalWeekId },
      user.id,
    );
  }, [
    isSignalExecution,
    signalActiveProgramIsValid,
    signalDayId,
    signalWeekId,
    signalWorkoutPayload,
    signalWorkoutSelection?.status,
    user?.id,
  ]);
  const workoutPlan = signalWorkoutPlan ?? workoutQuery.data ?? null;
  const activeSignalProgram =
    activeProgram?.source === "signal" && activeProgram.source_program_id === signalProgramId ? activeProgram : null;
  const signalSessionScope = useMemo(() => {
    if (!isSignalExecution || !activeSignalProgram || !signalProgramId || !signalWeekId || !signalDayId) return null;
    return {
      activeProgramId: activeSignalProgram.id,
      sourceDayKey: signalDayId,
      sourceProgramId: signalProgramId,
      sourceProgramVersion: signalProgramVersionId,
      sourceWeekKey: signalWeekId,
    };
  }, [
    activeSignalProgram,
    isSignalExecution,
    signalDayId,
    signalProgramId,
    signalProgramVersionId,
    signalWeekId,
  ]);
  const {
    sessionId,
    sessionQuery,
    startSession,
    startSessionMutation,
  } = useWorkoutSession(workoutPlan, signalSessionScope);

  const advanceActiveProgramMutation = useAdvanceActiveProgramAfterWorkout();
  const completeSetMutation = useCompleteSet();
  const finishWorkoutMutation = useFinishWorkout();
  const discardWorkoutMutation = useDiscardWorkoutSession();
  const setInputRefs = useRef<Record<string, TextInput | null>>({});
  const finishLockRef = useRef(false);
  const [completionSummary, setCompletionSummary] = useState<WorkoutCompletionSummary | null>(null);
  const [reflectionIntensity, setReflectionIntensity] = useState<number>(7);
  const [reflectionDurationMinutes, setReflectionDurationMinutes] = useState<string>("");
  const [reflectionNote, setReflectionNote] = useState<string>("");
  const [shareWithCoachAndTeam, setShareWithCoachAndTeam] = useState<boolean>(false);
  const [signalFinishError, setSignalFinishError] = useState<string | null>(null);
  const [showRestTimerOptions, setShowRestTimerOptions] = useState(false);
  const [showCustomTimerInput, setShowCustomTimerInput] = useState(false);
  const [customTimerInput, setCustomTimerInput] = useState("");
  const [isSavingAndExiting, setIsSavingAndExiting] = useState(false);
  const signalCompletionSummary = isSignalExecution ? completionSummary : null;
  const [pendingCompletedSetKeys, setPendingCompletedSetKeys] = useState<Set<string>>(() => new Set());
  const restTimer = useRestTimer();
  const resetRestTimer = restTimer.reset;
  const isRestTimerCompleted = restTimer.isCompleted;
  const signalProgramErrorCode = getProgramsErrorCode(signalWorkoutQuery.error);
  const signalExecutionIssue = useMemo(() => {
    if (!isSignalExecution) return null;

    if (!signalProgramId) {
      return {
        body: "This workout link is missing a program id.",
        retry: false,
        title: "Invalid workout",
      } as const;
    }

    if (isActiveProgramLoading) {
      return null;
    }

    if (signalWorkoutQuery.error) {
      if (signalProgramErrorCode === "NOT_FOUND") {
        return {
          body: "This workout is no longer published or was removed.",
          retry: true,
          title: "Workout unavailable",
        } as const;
      }

      if (
        signalProgramErrorCode === "PARSE_ERROR" ||
        signalProgramErrorCode === "CONFIGURATION_ERROR" ||
        signalProgramErrorCode === "BAD_REQUEST"
      ) {
        return {
          body: "The Signal API returned an invalid workout payload.",
          retry: true,
          title: "Workout unavailable",
        } as const;
      }

      return {
        body: "Check your connection and try again.",
        retry: true,
        title: "Unable to load workout",
      } as const;
    }

    if (signalWorkoutPayload?.weeks.length === 0) {
      return {
        body: "This published workout does not contain any weeks yet.",
        retry: true,
        title: "Workout unavailable",
      } as const;
    }

    if (!signalWorkoutSelection || signalWorkoutSelection.status !== "ok") {
      return {
        body: "The selected Signal week or day could not be found.",
        retry: false,
        title: "Invalid workout",
      } as const;
    }

    if (activeProgramQuery.error) {
      return {
        body: "We could not load your active Signal program.",
        retry: true,
        title: "Active program unavailable",
      } as const;
    }

    if (isSignalExecution && !signalActiveProgramIsValid) {
      return {
        body: "Your active Signal program does not match this published program.",
        retry: false,
        title: "Active program unavailable",
      } as const;
    }

    return null;
  }, [
    isSignalExecution,
    isActiveProgramLoading,
    signalActiveProgramIsValid,
    signalProgramErrorCode,
    signalProgramId,
    signalWorkoutPayload?.weeks.length,
    activeProgramQuery.error,
    signalWorkoutQuery.error,
    signalWorkoutSelection,
  ]);

  useEffect(() => {
    const failures = [
      ...(!isSignalExecution ? ([
        ["enrollments", enrollmentsQuery.error],
        ["workout", workoutQuery.error],
      ] as const) : []),
      ...(isSignalExecution ? ([["signal-workout", signalWorkoutQuery.error]] as const) : []),
      ["workout-session", sessionQuery.error],
      ["start-session", startSessionMutation.error],
      ["complete-set", completeSetMutation.error],
      ["finish-workout", finishWorkoutMutation.error],
    ].filter(([, error]) => Boolean(error));

    failures.forEach(([type, error]) => {
      console.warn("[athlete-flow]", {
        error: error instanceof Error ? error.message : String(error),
        screen: "WorkoutPlayer",
        type,
      });
    });
  }, [
    completeSetMutation.error,
    enrollmentsQuery.error,
    finishWorkoutMutation.error,
    isSignalExecution,
    sessionQuery.error,
    startSessionMutation.error,
    signalWorkoutQuery.error,
    workoutQuery.error,
  ]);

  const isLoading = isSignalExecution
    ? signalWorkoutQuery.isLoading || activeProgramQuery.isLoading || (workoutPlan ? sessionQuery.isLoading : false)
    : enrollmentsQuery.isLoading || workoutQuery.isLoading || (workoutPlan ? sessionQuery.isLoading : false);
  const hasError = isSignalExecution
    ? Boolean(sessionQuery.error)
    : Boolean(enrollmentsQuery.error || workoutQuery.error || sessionQuery.error);
  const activeEnrollment = useMemo(() => {
    if (isSignalExecution) return null;
    return (enrollmentsQuery.data ?? []).find((enrollment) => enrollment.status === "active") ?? null;
  }, [enrollmentsQuery.data, isSignalExecution]);
  const hasWorkoutAccess = isSignalExecution ? Boolean(workoutPlan) : Boolean(activeEnrollment);

  const logs = useMemo<WorkoutLogSet[]>(() => sessionQuery.data?.logs ?? [], [sessionQuery.data?.logs]);
  const normalizedLogs = useMemo(() => {
    const byKey = new Map<string, WorkoutLogSet>();
    logs.forEach((log) => {
      const key = buildWorkoutLogKey(getWorkoutLogIdentityKey(log), log.set_number);
      const existing = byKey.get(key);
      if (!existing) {
        byKey.set(key, log);
        return;
      }

      const existingTime = Date.parse(existing.logged_at ?? "") || 0;
      const nextTime = Date.parse(log.logged_at ?? "") || 0;
      if (nextTime >= existingTime) {
        byKey.set(key, log);
      }
    });
    return Array.from(byKey.values()).sort((a, b) => {
      if (getWorkoutLogIdentityKey(a) === getWorkoutLogIdentityKey(b)) {
        return a.set_number - b.set_number;
      }
      return a.logged_at.localeCompare(b.logged_at);
    });
  }, [logs]);
  const completedSetNumbersByExercise = useMemo(() => {
    const map = new Map<string, Set<number>>();
    normalizedLogs.forEach((log) => {
      const identityKey = getWorkoutLogIdentityKey(log);
      const current = map.get(identityKey) ?? new Set<number>();
      current.add(log.set_number);
      map.set(identityKey, current);
    });
    return map;
  }, [normalizedLogs]);
  const exerciseProgress = useMemo(() => {
    const map = new Map<string, number>();
    completedSetNumbersByExercise.forEach((setNumbers, exerciseId) => {
      map.set(exerciseId, setNumbers.size);
    });
    return map;
  }, [completedSetNumbersByExercise]);

  const [currentStepIndex, setCurrentStepIndex] = useState(signalInitialStepIndex);

  useEffect(() => {
    setCurrentStepIndex(signalInitialStepIndex);
    setSetDrafts({});
    setExerciseNotes({});
    setExtraSetsByExercise({});
    setCompletionSummary(null);
    setReflectionIntensity(7);
    setReflectionDurationMinutes("");
    setReflectionNote("");
    setShareWithCoachAndTeam(false);
    setSignalFinishError(null);
    setShowRestTimerOptions(false);
    setShowCustomTimerInput(false);
    setCustomTimerInput("");
    setPendingCompletedSetKeys(new Set());
    resetRestTimer();
  }, [resetRestTimer, signalDayId, signalInitialStepIndex, signalWeekId]);

  useEffect(() => {
    if (!isRestTimerCompleted) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }, [isRestTimerCompleted]);

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
  const activeExercise: WorkoutExercise | null = useMemo(() => {
    if (isSignalExecution) return null;
    return workoutPlan?.exercises?.[0] ?? null;
  }, [isSignalExecution, workoutPlan?.exercises]);

  const sessionComplete = Boolean(sessionQuery.data?.session.completed_at);
  const hasStartedSession = Boolean(sessionId && sessionQuery.data?.session.cancelled_at === null);
  
  if (__DEV__) {
    console.log("[WorkoutSessionDebug] useWorkoutSession state", {
      dayId: workoutPlan?.day.id,
      programId: workoutPlan?.program.id,
      versionId: activeProgram?.source_program_version,
      sessionId,
      hasData: Boolean(sessionQuery.data),
      isFetching: sessionQuery.isFetching
    });
  }
  const completedExerciseCount = useMemo(() => {
    if (!workoutPlan?.exercises?.length) return 0;
    return workoutPlan.exercises.filter((item) => {
      const completed = exerciseProgress.get(getWorkoutExerciseIdentityKey(item)) ?? 0;
      const target = parseSignalFallbackSetCount(item);
      return target > 0 && completed >= target;
    }).length;
  }, [exerciseProgress, workoutPlan?.exercises]);
  const completedSetCount = normalizedLogs.length;
  const signalLiveTotals = useMemo(
    () =>
      normalizedLogs.reduce(
        (acc, log) => {
          const reps = log.reps_completed ?? 0;
          const weightLbs = log.weight_kg != null ? kgToLbs(Number(log.weight_kg)) : 0;
          return {
            reps: acc.reps + reps,
            sets: acc.sets + 1,
            volumeLbs: acc.volumeLbs + reps * weightLbs,
          };
        },
        { reps: 0, sets: 0, volumeLbs: 0 },
      ),
    [normalizedLogs],
  );

  const [setDrafts, setSetDrafts] = useState<Record<string, { lbs: string; reps: string; rpe: string }>>({});
  const [exerciseNotes, setExerciseNotes] = useState<Record<string, string>>({});
  const [extraSetsByExercise, setExtraSetsByExercise] = useState<Record<string, number>>({});
  const [activeCoachMedia, setActiveCoachMedia] = useState<SignalCoachMediaPreview | null>(null);
  const [coachMediaError, setCoachMediaError] = useState(false);

  useEffect(() => {
    setSetDrafts({});
  }, [sessionId, signalDayId, signalWeekId]);

  useEffect(() => {
    setActiveCoachMedia(null);
    setCoachMediaError(false);
  }, [signalDayId, signalWeekId]);

  useEffect(() => {
    if (!normalizedLogs.length) return;

    setSetDrafts((current) => {
      const next = { ...current };
      normalizedLogs.forEach((log) => {
        const draftKey = buildWorkoutLogKey(getWorkoutLogIdentityKey(log), log.set_number);
        if (next[draftKey]) return;
        next[draftKey] = {
          lbs: log.weight_kg != null ? String(Math.round(kgToLbs(Number(log.weight_kg)))) : "",
          reps: log.reps_completed != null ? String(log.reps_completed) : "",
          rpe: log.rpe_actual != null ? String(log.rpe_actual) : "",
        };
      });
      return next;
    });
  }, [normalizedLogs]);

  useEffect(() => {
    if (!workoutPlan?.exercises?.length || !normalizedLogs.length) return;

    setExtraSetsByExercise((current) => {
      const next = { ...current };
      let changed = false;

      workoutPlan.exercises.forEach((exercise) => {
        const exerciseId = getWorkoutExerciseIdentityKey(exercise);
        const targetSets = getTargetSets(exercise);
        const inferredExtraSets = normalizedLogs.reduce((max, log) => {
          if (getWorkoutLogIdentityKey(log) !== exerciseId) return max;
          return Math.max(max, log.set_number - targetSets);
        }, 0);
        const currentExtraSets = next[exerciseId] ?? 0;
        if (inferredExtraSets > currentExtraSets) {
          next[exerciseId] = inferredExtraSets;
          changed = true;
        }
      });

      return changed ? next : current;
    });
  }, [normalizedLogs, workoutPlan?.exercises]);

  useEffect(() => {
    if (pendingCompletedSetKeys.size === 0) return;

    setPendingCompletedSetKeys((current) => {
      const next = new Set(current);
      normalizedLogs.forEach((log) => {
        next.delete(buildWorkoutLogKey(getWorkoutLogIdentityKey(log), log.set_number));
      });
      return next.size === current.size ? current : next;
    });
  }, [normalizedLogs, pendingCompletedSetKeys.size]);

  const canGoToPreviousSignalStep = Boolean(isSignalExecution && safeStepIndex > 0);
  const isCoachInstructionsStep = currentStepType === "coach_instructions";
  const isInstructionBlockStep = currentStepType === "instruction_block";
  const isExerciseBlockStep = currentStepType === "exercise_block";
  const isDoneTrainingStep = currentStepType === "done_training";
  const signalStepPrimaryLabel = isCoachInstructionsStep
    ? "Got It"
    : isInstructionBlockStep
      ? "Complete"
      : isExerciseBlockStep
        ? hasStartedSession
          ? "Next"
          : "Begin Logging"
        : isDoneTrainingStep
          ? "Continue"
          : "Next";
  const isReflectionStep = currentStepType === "reflection";
  const isSummaryStep = currentStepType === "summary";
  const isWorkoutProgressStep = isCoachInstructionsStep || isInstructionBlockStep || isExerciseBlockStep;
  const signalRightActionLabel = isCoachInstructionsStep
    ? "Got It"
    : isInstructionBlockStep
      ? "Complete"
      : isExerciseBlockStep
        ? "Next"
        : signalStepPrimaryLabel;
  const signalCenterActionLabel = !hasStartedSession
    ? "Begin Logging"
    : restTimer.isRunning && restTimer.formattedRemaining
      ? `Rest ${restTimer.formattedRemaining}`
      : restTimer.isPaused && restTimer.formattedRemaining
        ? `Paused ${restTimer.formattedRemaining}`
        : restTimer.isCompleted
          ? "Rest Done"
          : "Select Timer";
  const signalStepCount = signalProgressSteps.length;
  const signalStepProgress =
    signalStepCount > 0 ? (Math.min(signalProgressIndex + 1, signalStepCount) / signalStepCount) : 0;
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
  const currentSignalBlockExercises = useMemo(() => {
    if (!isSignalExecution || currentStep?.type !== "exercise_block" || !workoutPlan || !currentStep.block || !currentStep.blockLabel) {
      return [];
    }
    const blockLabel = currentStep.blockLabel;

    return currentStep.block.exercises.map((payloadExercise, exerciseIndex) => {
      const workoutExercise =
        workoutPlan.exercises.find(
          (exercise) =>
            exercise.prescription.id === payloadExercise.id ||
            exercise.source_exercise_key === payloadExercise.sync_key ||
            exercise.exercise.id === payloadExercise.exerciseId,
        ) ?? null;
      const exerciseId = workoutExercise ? getWorkoutExerciseIdentityKey(workoutExercise) : payloadExercise.sync_key;
      const completedSetNumbers = completedSetNumbersByExercise.get(exerciseId) ?? new Set<number>();
      const targetSets = Math.max(1, getSignalPrescribedSetCount(workoutExercise, payloadExercise));
      const prescribedReps = getSignalPrescribedRepsValue(workoutExercise, payloadExercise);
      const prescribedRpe = getSignalPrescribedRpeValue(workoutExercise, payloadExercise);
      let nextSetNumber = targetSets;
      for (let setNumber = 1; setNumber <= targetSets; setNumber += 1) {
        if (!completedSetNumbers.has(setNumber)) {
          nextSetNumber = setNumber;
          break;
        }
      }
      const coachMedia = getSignalCoachMediaPreview(workoutExercise, payloadExercise.exerciseName);
      const mediaUrl = coachMedia?.url && isValidHttpUrl(coachMedia.url) ? coachMedia.url : null;

      if (__DEV__) {
        console.log("[PlayerPrescription] exercise", {
          name: payloadExercise.exerciseName,
          reps: payloadExercise.reps,
          rest: payloadExercise.rest,
          rpe: payloadExercise.rpe,
          sets: payloadExercise.sets,
        });
        console.log("[PlayerSetRows]", {
          name: payloadExercise.exerciseName,
          prescribedSets: targetSets,
          rows: targetSets,
        });
      }

      return {
        completedSetNumbers,
        coachMedia,
        exerciseId,
        exerciseIndex,
        label: getSignalExerciseLabel(blockLabel, exerciseIndex),
        note: exerciseNotes[exerciseId] ?? "",
        payloadExercise,
        targetSets,
        nextSetNumber,
        workoutExercise,
        demoLabel: mediaUrl ? "View Demo" : "Search Demo",
        demoThumbnailUrl: coachMedia?.thumbnailUrl ?? null,
        demoTitle: coachMedia?.title ?? payloadExercise.exerciseName,
        demoUrl: mediaUrl ?? buildSignalDemoSearchUrl(payloadExercise.exerciseName),
        demoVideoId: coachMedia?.videoId ?? null,
        prescribedReps,
        prescribedRpe,
        extraSets: extraSetsByExercise[exerciseId] ?? 0,
      };
    });
  }, [
    completedSetNumbersByExercise,
    currentStep,
    exerciseNotes,
    extraSetsByExercise,
    isSignalExecution,
    workoutPlan,
  ]);
  const shouldEnableFooter =
    Boolean(sessionId) && !finishWorkoutMutation.isPending && !sessionComplete && !finishLockRef.current && !completionSummary;
  const footerLabel = finishWorkoutMutation.isPending ? "Finishing..." : "Finish Workout";
  const footerAction = handleFinishWorkout;

  useEffect(() => {
    if (!__DEV__ || !isSignalExecution) return;
    console.log("[signal-ordered-steps]", {
      currentStepIndex: safeStepIndex,
      initialStepIndex: signalInitialStepIndex,
      steps: signalWorkoutStepLines,
      totalSteps: signalOrderedSteps.length,
    });

    if (signalWorkoutBlockCount <= 1) {
      console.warn(
        "Signal demo program only has one block. To test A/B/C/D/E flow, create/publish a Signal day with multiple blocks.",
      );
    }
  }, [
    isSignalExecution,
    safeStepIndex,
    signalInitialStepIndex,
    signalOrderedSteps.length,
    signalWorkoutBlockCount,
    signalWorkoutStepLines,
  ]);

  const handleCompleteSet = async (exercise: WorkoutExercise, setNumber: number) => {
    if (!sessionId || completeSetMutation.isPending || sessionComplete) return;
    const exerciseIdentityKey = getWorkoutExerciseIdentityKey(exercise);
    const completedSetNumbers = completedSetNumbersByExercise.get(exerciseIdentityKey) ?? new Set<number>();
    const targetSets = getTargetSets(exercise);
    const isExerciseComplete = targetSets > 0 && completedSetNumbers.size >= targetSets;
    const logKey = buildWorkoutLogKey(exerciseIdentityKey, setNumber);
    if (isExerciseComplete || completedSetNumbers.has(setNumber) || pendingCompletedSetKeys.has(logKey)) {
      return;
    }
    const draft = setDrafts[logKey] ?? { lbs: "", reps: "", rpe: "" };
    const totalSets = targetSets;
    const willCompleteExercise = totalSets > 0 && setNumber >= totalSets;
    const normalized = normalizeCompletedSetPayload({ draft, exercise, isSignalWorkout: isSignalExecution, setNumber });
    const payload = {
      exerciseLibraryId: normalized.exerciseLibraryId,
      exerciseName: normalized.exerciseName,
      repsCompleted: normalized.repsCompleted,
      rpeActual: normalized.rpeActual,
      sessionId,
      setNumber: normalized.setNumber,
      sourceExerciseKey: normalized.sourceExerciseKey,
      weightKg: normalized.weightKg,
    };

    if (__DEV__ && isSignalExecution) {
      console.log("[CompleteSet] draft", draft);
      console.log("[CompleteSet] payload", payload);
        console.log("[signal-workout-player]", {
          activeExerciseId: exerciseIdentityKey,
          activeExerciseName: exercise.exercise.name,
          completedSetCount: completedSetNumbers.size,
          nextSetNumber: setNumber,
        repsCompleted: normalized.repsCompleted,
        rpeActual: normalized.rpeActual,
        sessionId,
        weightKg: normalized.weightKg,
      });
    }

    try {
      setPendingCompletedSetKeys((current) => {
        const next = new Set(current);
        next.add(logKey);
        return next;
      });
      const result = await completeSetMutation.mutateAsync(payload);
      if (__DEV__ && isSignalExecution) {
        console.log("[CompleteSet] success", result);
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

      if (!willCompleteExercise) {
        setTimeout(() => {
          setInputRefs.current[buildWorkoutLogKey(exerciseIdentityKey, setNumber + 1)]?.focus();
        }, 150);
      }
    } catch (error) {
      if (__DEV__ && isSignalExecution) {
        console.log("[CompleteSet] error", {
          error: error instanceof Error ? error.message : String(error),
          sessionId,
        });
      }
      setPendingCompletedSetKeys((current) => {
        const next = new Set(current);
        next.delete(logKey);
        return next;
      });
      console.warn("[athlete-flow]", {
        error: error instanceof Error ? error.message : String(error),
        screen: "WorkoutPlayer",
        type: "complete-set-action",
      });
      sessionQuery.refetch();
    }
  };

  const handleSignalStepBack = () => {
    if (!isSignalExecution) return;
    setShowRestTimerOptions(false);
    setShowCustomTimerInput(false);
    if (safeStepIndex > 0) {
      setCurrentStepIndex((current) => Math.max(0, current - 1));
      Haptics.selectionAsync().catch(() => {});
      return;
    }

    restTimer.reset();
    router.replace(SIGNAL_WORKOUT_HOME_HREF);
  };

  const handleSignalHeaderNext = () => {
    if (!isSignalExecution || !currentStep) return;
    setShowRestTimerOptions(false);
    setShowCustomTimerInput(false);

    if (isSummaryStep) {
      restTimer.reset();
      router.replace(SIGNAL_WORKOUT_HOME_HREF);
      return;
    }

    if (isReflectionStep && !completionSummary) {
      return;
    }

    setCurrentStepIndex((current) => Math.min(signalOrderedSteps.length - 1, current + 1));
    Haptics.selectionAsync().catch(() => {});
  };

  const handleOpenCoachMedia = (preview: SignalCoachMediaPreview) => {
    setCoachMediaError(false);
    setActiveCoachMedia(preview);
  };

  const handleCloseCoachMedia = () => {
    setActiveCoachMedia(null);
    setCoachMediaError(false);
  };

  const coachMediaModalNode = activeCoachMedia ? (
    <Modal animationType="slide" transparent visible onRequestClose={handleCloseCoachMedia}>
      <View className="flex-1 bg-black/80 px-4 pb-4" style={{ paddingTop: insets.top + spacing[4] }}>
        <View className="flex-1 overflow-hidden rounded-[28px] border border-white/10 bg-[#0f1316]">
          <View className="flex-row items-center justify-between border-b border-white/10 px-4 py-3">
            <View className="flex-1 pr-3">
              <Typography className="tracking-[1px] opacity-70" tone="inverse" variant="labelSm">
                COACH DEMO
              </Typography>
              <Typography numberOfLines={1} tone="inverse" variant="bodyLg">
                {activeCoachMedia.title}
              </Typography>
            </View>
            <Pressable
              accessibilityLabel="Close demo"
              accessibilityRole="button"
              className="h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]"
              hitSlop={8}
              onPress={handleCloseCoachMedia}
            >
              <Ionicons color={colors.white} name="close" size={18} />
            </Pressable>
          </View>

          <View className="flex-1 bg-black">
            {activeCoachMedia.videoId && !coachMediaError ? (
              <WebView
                allowsFullscreenVideo
                javaScriptEnabled
                mediaPlaybackRequiresUserAction={false}
                onError={() => setCoachMediaError(true)}
                source={{ uri: buildYouTubeEmbedUrl(activeCoachMedia.videoId) }}
                startInLoadingState
                renderLoading={() => (
                  <View className="flex-1 items-center justify-center bg-black">
                    <ActivityIndicator color={colors.emerald} />
                  </View>
                )}
              />
            ) : (
              <View className="flex-1 items-center justify-center px-6">
                <Typography align="center" className="opacity-80" tone="inverse" variant="bodyMd">
                  We could not play this video in-app.
                </Typography>
                <AppButton
                  className="mt-4"
                  onPress={() => {
                    const fallbackUrl = activeCoachMedia.url ?? (activeCoachMedia.videoId ? buildYouTubeWatchUrl(activeCoachMedia.videoId) : null);
                    if (fallbackUrl) {
                      Linking.openURL(fallbackUrl).catch(() => {});
                    }
                  }}
                  variant="secondary"
                >
                  Open original video
                </AppButton>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  ) : null;

  const signalHeaderNode = isSignalExecution ? (
    <View
      className="absolute inset-x-0 z-20 border-b border-white/10 bg-[#0f1316]"
      style={[styles.signalHeaderWrap, { paddingTop: insets.top + spacing[1] }]}
    >
      <View className="px-container pb-3">
        <View className="flex-row items-center justify-between">
          <Pressable
            accessibilityLabel="Close workout"
            accessibilityRole="button"
            className="h-10 w-10 items-center justify-center rounded-sm border border-white/10 bg-white/[0.04]"
            disabled={isSavingAndExiting}
            hitSlop={8}
            onPress={() => {
              if (isSavingAndExiting) return;
              if (hasStartedSession) {
                console.log("[WorkoutPlayer] exit requested", { hasStartedSession, sessionId });
                Alert.alert(
                  "Leave workout?",
                  "Your progress is saved. You can resume this workout later.",
                  [
                    { text: "Continue Workout", style: "cancel" },
                    {
                      text: "Discard Session",
                      style: "destructive",
                      onPress: () => {
                        console.log("[WorkoutPlayer] discard session requested", { sessionId });
                        Alert.alert(
                          "Discard session?",
                          "This will delete this in-progress workout session and any sets logged in it. This cannot be undone.",
                          [
                            { text: "Cancel", style: "cancel" },
                            {
                              text: "Discard",
                              style: "destructive",
                              onPress: () => handleDiscardSession(),
                            }
                          ]
                        );
                      },
                    },
                    {
                      text: "Save & Exit",
                      style: "default",
                      onPress: () => {
                        console.log("[WorkoutPlayer] save and exit", { sessionId });
                        void handleSaveAndExit();
                      },
                    },
                  ]
                );
              } else {
                console.log("[WorkoutPlayer] exit requested", { hasStartedSession, sessionId });
                restTimer.reset();
                router.replace(SIGNAL_WORKOUT_HOME_HREF);
              }
            }}
          >
            <Ionicons color={colors.white} name="close" size={18} />
          </Pressable>
          <View className="flex-1 px-4">
            <View className="flex-row items-center justify-center gap-1.5">
              <Typography align="center" className="tracking-[1px] opacity-70" tone="inverse" variant="labelSm">
                STEP {Math.min(safeStepIndex + 1, Math.max(1, signalStepCount))} OF {Math.max(1, signalStepCount)}
              </Typography>
              {hasStartedSession ? (
                <View className="rounded bg-emerald/20 px-1 py-0.5">
                  <Typography className="text-[9px] tracking-[1px] text-emerald" variant="labelSm" style={{ fontSize: 9, lineHeight: 11 }}>
                    LIVE
                  </Typography>
                </View>
              ) : null}
            </View>
            <Typography align="center" numberOfLines={1} tone="inverse" variant="bodyLg">
              {currentStepTitle ?? workoutPlan?.day.title ?? "Workout"}
            </Typography>
          </View>
          <View className="flex-row items-center gap-2">
            {hasStartedSession && !isSummaryStep && !isReflectionStep && !isDoneTrainingStep ? (
              <Pressable
                accessibilityLabel="Finish early"
                accessibilityRole="button"
                className="h-10 items-center justify-center px-2"
                hitSlop={8}
                onPress={() => {
                  console.log("[WorkoutPlayer] finish early requested", { sessionId });
                  Alert.alert(
                    "Finish workout early?",
                    "This will save your logged sets and take you to reflection.",
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Finish Early",
                        style: "destructive",
                        onPress: () => {
                          const reflectionStepIndex = signalOrderedSteps.findIndex((step) => step.type === "reflection");
                          if (reflectionStepIndex >= 0) {
                            setCurrentStepIndex(reflectionStepIndex);
                          }
                        },
                      },
                    ]
                  );
                }}
              >
                <Typography className="opacity-70" tone="inverse" variant="labelSm">
                  Finish
                </Typography>
              </Pressable>
            ) : null}
            <Pressable
              accessibilityLabel="Next step"
              accessibilityRole="button"
              className="h-10 w-10 items-center justify-center rounded-sm border border-white/10 bg-white/[0.04]"
              hitSlop={8}
              onPress={handleSignalHeaderNext}
            >
              <Ionicons color={colors.white} name="arrow-forward" size={18} />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  ) : null;

  const handleSignalStepPrimary = async () => {
    if (!isSignalExecution || !currentStep) return;
    setShowRestTimerOptions(false);
    setShowCustomTimerInput(false);

    if (isCoachInstructionsStep) {
      setCurrentStepIndex((current) => Math.min(signalOrderedSteps.length - 1, current + 1));
      Haptics.selectionAsync().catch(() => {});
      return;
    }

    if (isInstructionBlockStep) {
      setCurrentStepIndex((current) => Math.min(signalOrderedSteps.length - 1, current + 1));
      Haptics.selectionAsync().catch(() => {});
      return;
    }

    if (isExerciseBlockStep) {
      setCurrentStepIndex((current) => Math.min(signalOrderedSteps.length - 1, current + 1));
      Haptics.selectionAsync().catch(() => {});
      return;
    }

    if (isDoneTrainingStep) {
      const reflectionStepIndex = signalOrderedSteps.findIndex((step) => step.type === "reflection");
      if (reflectionStepIndex >= 0) {
        setCurrentStepIndex(reflectionStepIndex);
        Haptics.selectionAsync().catch(() => {});
      }
      return;
    }

    if (isSummaryStep) {
      restTimer.reset();
      router.replace(SIGNAL_WORKOUT_HOME_HREF);
      return;
    }

    setCurrentStepIndex((current) => Math.min(signalOrderedSteps.length - 1, current + 1));
    Haptics.selectionAsync().catch(() => {});
  };

  const handleSignalFooterCenterPress = async () => {
    if (!isSignalExecution || !isWorkoutProgressStep) return;

    if (!hasStartedSession) {
      console.log("[WorkoutPlayer] begin logging pressed", { sessionId });
      await handleStartWorkout();
      return;
    }

    setShowRestTimerOptions((current) => !current);
    setShowCustomTimerInput(false);
  };

  const handleSignalTimerSelect = (seconds: number) => {
    restTimer.start(seconds);
    setShowRestTimerOptions(false);
    setShowCustomTimerInput(false);
    setCustomTimerInput("");
  };

  async function flushWorkoutDraftsBeforeExit() {
    if (!sessionId || !workoutPlan || !isSignalExecution) return 0;

    console.log("[SaveExit] drafts", setDrafts);
    console.log("[SaveExit] requested", {
      draftCount: Object.keys(setDrafts ?? {}).length,
      extraSetsByExercise,
      sessionId,
    });

    let savedCount = 0;

    for (const exercise of workoutPlan.exercises ?? []) {
      const exerciseId = getWorkoutExerciseIdentityKey(exercise);
      const exerciseName = exercise.exercise.name;
      const targetSets = getTargetSets(exercise);
      const extraSets = extraSetsByExercise[exerciseId] ?? 0;
      const totalSets = targetSets + extraSets;

      for (let setNumber = 1; setNumber <= totalSets; setNumber += 1) {
        const logKey = buildWorkoutLogKey(exerciseId, setNumber);
        const draft = setDrafts[logKey] ?? { lbs: "", reps: "", rpe: "" };
        const isAlreadyCompleted = completedSetNumbersByExercise.get(exerciseId)?.has(setNumber) ?? false;
        const isPending = pendingCompletedSetKeys.has(logKey);
        const hasMeaningfulDraft = Boolean(draft.lbs.trim() || draft.reps.trim() || draft.rpe.trim());

        if (isAlreadyCompleted && !isPending) continue;
        if (!hasMeaningfulDraft && !isPending) continue;

        console.log("[SaveExit] flushing draft", {
          draft,
          exerciseName,
          sessionId,
          setNumber,
        });

        const normalized = normalizeCompletedSetPayload({ draft, exercise, isSignalWorkout: isSignalExecution, setNumber });
        const payload = {
          exerciseLibraryId: normalized.exerciseLibraryId,
          exerciseName: normalized.exerciseName,
          repsCompleted: normalized.repsCompleted,
          rpeActual: normalized.rpeActual,
          sessionId,
          setNumber: normalized.setNumber,
          sourceExerciseKey: normalized.sourceExerciseKey,
          weightKg: normalized.weightKg,
        };

        console.log("[SaveExit] payload", payload);

        try {
          const result = await workoutService.completeSet(payload);
          console.log("[SaveExit] success", result);
          savedCount += 1;
        } catch (error) {
          console.log("[SaveExit] error", {
            error: error instanceof Error ? error.message : String(error),
            sessionId,
          });
          throw error;
        }
      }
    }

    console.log("[SaveExit] flush success", {
      savedCount,
      sessionId,
    });

    return savedCount;
  }

  async function handleSaveAndExit() {
    if (!sessionId || isSavingAndExiting) return;
    setIsSavingAndExiting(true);
    try {
      const savedCount = await flushWorkoutDraftsBeforeExit();
      const scopedQueries = signalSessionScope && user?.id
        ? [
            queryKeys.signalWorkoutSession(
              user.id,
              signalSessionScope.activeProgramId,
              signalSessionScope.sourceProgramId,
              signalSessionScope.sourceProgramVersion,
              signalSessionScope.sourceWeekKey,
              signalSessionScope.sourceDayKey,
            ),
            queryKeys.signalWorkoutSessionPlan(
              user.id,
              signalSessionScope.activeProgramId,
              signalSessionScope.sourceProgramId,
              signalSessionScope.sourceProgramVersion,
              signalSessionScope.sourceWeekKey,
              signalSessionScope.sourceDayKey,
            ),
            queryKeys.signalWorkoutSessionStatus(
              user.id,
              signalSessionScope.activeProgramId,
              signalSessionScope.sourceProgramId,
              signalSessionScope.sourceProgramVersion,
              signalSessionScope.sourceWeekKey,
              signalSessionScope.sourceDayKey,
            ),
          ]
        : [];

      const invalidatePromises = scopedQueries.map((queryKey) =>
        queryClient.invalidateQueries({ exact: true, queryKey }),
      );
      invalidatePromises.push(queryClient.invalidateQueries({ queryKey: ["workout", "signal-session-plan"] }));
      invalidatePromises.push(queryClient.invalidateQueries({ queryKey: ["workout", "signal-session-status"] }));
      if (sessionId) {
        invalidatePromises.push(queryClient.invalidateQueries({ exact: true, queryKey: queryKeys.workoutSession(sessionId) }));
      }
      if (user?.id) {
        invalidatePromises.push(queryClient.invalidateQueries({ queryKey: queryKeys.workoutActiveSession(user.id) }));
      }
      await Promise.all(invalidatePromises);

      console.log("[SaveExit] flushed and navigating home", {
        savedCount,
        sessionId,
      });
      restTimer.reset();
      router.replace(SIGNAL_WORKOUT_HOME_HREF);
    } catch (error) {
      console.log("[SaveExit] flush error", {
        error: error instanceof Error ? error.message : String(error),
        sessionId,
      });
      Alert.alert(
        "Could not save session",
        "We could not save your latest workout changes before leaving. Please stay on the workout screen and try again.",
      );
      workoutQuery.refetch();
      sessionQuery.refetch();
    } finally {
      setIsSavingAndExiting(false);
    }
  }

  const handleStartCustomTimer = () => {
    const parsed = Number.parseInt(customTimerInput.trim(), 10);
    if (!Number.isFinite(parsed) || parsed < 5 || parsed > 60 * 30) return;
    restTimer.setCustomDuration(parsed);
    restTimer.start(parsed);
    setShowCustomTimerInput(false);
    setShowRestTimerOptions(false);
    setCustomTimerInput("");
  };

  const handleStartWorkout = async () => {
    if (startSessionMutation.isPending || sessionId) return false;
    try {
      await startSession();
      return true;
    } catch (error) {
      console.log("[BeginLoggingDebug] raw start error", {
        code: error instanceof Error ? (error as { code?: string }).code ?? null : null,
        details: error instanceof Error ? (error as { details?: string }).details ?? null : null,
        hint: error instanceof Error ? (error as { hint?: string }).hint ?? null : null,
        json: JSON.stringify(error, null, 2),
        message: error instanceof Error ? error.message : String(error),
        name: error instanceof Error ? error.name : typeof error,
        stack: error instanceof Error ? error.stack ?? null : null,
      });
      console.warn("[athlete-flow]", {
        error: error instanceof Error ? error.message : String(error),
        screen: "WorkoutPlayer",
        type: "start-session-action",
      });
      workoutQuery.refetch();
      sessionQuery.refetch();
      return false;
    }
  };

  async function handleFinishWorkout() {
    if (!sessionId || finishWorkoutMutation.isPending || sessionComplete || finishLockRef.current || completionSummary) return;
    setSignalFinishError(null);
    finishLockRef.current = true;
    try {
      const isSignalWorkout = Boolean(isSignalExecution && signalWorkoutPayload && activeSignalProgram);
      const currentWeekLabel = workoutPlan?.week.title ?? signalWorkoutPayload?.weeks.find((week) => week.id === signalWeekId || week.sync_key === signalWeekId)?.title ?? "Workout";
      const currentDayLabel = workoutPlan?.day.title ?? signalWorkoutPayload?.weeks
        .find((week) => week.id === signalWeekId || week.sync_key === signalWeekId)
        ?.days.find((day) => day.id === signalDayId || day.sync_key === signalDayId)?.title ?? "Workout";
      const summarySnapshot: Omit<WorkoutCompletionSummary, "nextWorkout" | "progressUpdateNeedsRefresh" | "isProgramCompleted"> = {
        completedDayTitle: currentDayLabel,
        completedExercises: completedExerciseCount,
        completedSets: completedSetCount,
        completedWeekLabel: currentWeekLabel,
        programTitle: workoutPlan?.program.title ?? signalWorkoutPayload?.program.title ?? "Workout",
      };

      await finishWorkoutMutation.mutateAsync(sessionId);

      if (!isSignalWorkout) {
        restTimer.reset();
        await new Promise((resolve) => setTimeout(resolve, 750));
        router.replace("/(tabs)");
        return;
      }

      const nextDay = signalWorkoutPayload
        ? findNextSignalWorkoutDay(signalWorkoutPayload, signalWeekId, signalDayId)
        : { error: "missing_program", isProgramCompleted: false, nextDayKey: null, nextWeekKey: null };
      let nextWorkout: WorkoutCompletionSummary["nextWorkout"] = null;
      let progressUpdateNeedsRefresh = false;

      if (nextDay.error) {
        progressUpdateNeedsRefresh = true;
        console.warn("[athlete-flow]", {
          error: nextDay.error,
          screen: "WorkoutPlayer",
          type: "active-program-advance-validation",
        });
      } else if (!nextDay.isProgramCompleted && nextDay.nextWeekKey && nextDay.nextDayKey && signalWorkoutPayload) {
        const nextWeek = signalWorkoutPayload.weeks.find((week) => week.id === nextDay.nextWeekKey || week.sync_key === nextDay.nextWeekKey);
        const nextDayRow = nextWeek?.days.find((day) => day.id === nextDay.nextDayKey || day.sync_key === nextDay.nextDayKey);
        if (!nextWeek || !nextDayRow) {
          progressUpdateNeedsRefresh = true;
        } else {
          nextWorkout = {
            dayId: nextDay.nextDayKey,
            dayLabel: nextDayRow.title,
            programId: signalWorkoutPayload.program.id,
            weekId: nextDay.nextWeekKey,
            weekLabel: nextWeek.title,
          };
        }
      }

      if (isSignalExecution && signalWorkoutPayload && activeSignalProgram) {
        if (!nextDay.error) {
          try {
            await advanceActiveProgramMutation.mutateAsync({
              activeProgramId: activeSignalProgram.id,
              completedSessionId: sessionId,
              isProgramCompleted: nextDay.isProgramCompleted,
              nextDayKey: nextDay.nextDayKey,
              nextWeekKey: nextDay.nextWeekKey,
            });
          } catch (error) {
            progressUpdateNeedsRefresh = true;
            console.warn("[athlete-flow]", {
              error: error instanceof Error ? error.message : String(error),
              screen: "WorkoutPlayer",
              type: "active-program-advance",
            });
          }
        }

        restTimer.reset();
        setCompletionSummary({
          ...summarySnapshot,
          isProgramCompleted: nextDay.isProgramCompleted,
          nextWorkout,
          progressUpdateNeedsRefresh,
        });
        const summaryStepIndex = signalOrderedSteps.findIndex((step) => step.type === "summary");
        if (summaryStepIndex >= 0) {
          setCurrentStepIndex(summaryStepIndex);
        }
        return;
      }

      restTimer.reset();
      await new Promise((resolve) => setTimeout(resolve, 750));
      router.replace("/(tabs)");
    } catch (error) {
      console.warn("[athlete-flow]", {
        error: error instanceof Error ? error.message : String(error),
        screen: "WorkoutPlayer",
        type: "finish-workout-action",
      });
      workoutQuery.refetch();
      sessionQuery.refetch();
      setSignalFinishError(error instanceof Error ? error.message : "Unable to finish workout.");
      finishLockRef.current = false;
    }
  }

  async function handleDiscardSession() {
    if (!sessionId || discardWorkoutMutation.isPending || finishLockRef.current) return;
    try {
      console.log("[DiscardDebug] before discard", {
        sessionId,
        hasStartedSession,
        routeParams: params,
      });

      console.log("[DiscardDebug] service deleting", { sessionId });
      const result = await discardWorkoutMutation.mutateAsync({
        sessionId,
        signalScope: signalSessionScope,
      });
      console.log("[DiscardDebug] after service discard", { sessionId });

      console.log("[DiscardDebug] discard result handled in UI", {
        status: result.status,
        sessionId
      });

      const resetKeys = [queryKeys.workoutSession(sessionId), queryKeys.workoutSessionPlans(), queryKeys.workoutSessionStatuses()] as const;
      const signalResetKeys = signalSessionScope
        ? [
            queryKeys.signalWorkoutSession(
              user?.id ?? "",
              signalSessionScope.activeProgramId,
              signalSessionScope.sourceProgramId,
              signalSessionScope.sourceProgramVersion,
              signalSessionScope.sourceWeekKey,
              signalSessionScope.sourceDayKey,
            ),
            queryKeys.signalWorkoutSessionPlan(
              user?.id ?? "",
              signalSessionScope.activeProgramId,
              signalSessionScope.sourceProgramId,
              signalSessionScope.sourceProgramVersion,
              signalSessionScope.sourceWeekKey,
              signalSessionScope.sourceDayKey,
            ),
            queryKeys.signalWorkoutSessionStatus(
              user?.id ?? "",
              signalSessionScope.activeProgramId,
              signalSessionScope.sourceProgramId,
              signalSessionScope.sourceProgramVersion,
              signalSessionScope.sourceWeekKey,
              signalSessionScope.sourceDayKey,
            ),
          ]
        : [];
      const broadSignalResetKeys = [["workout", "signal-session"], ["workout", "signal-session-plan"], ["workout", "signal-session-status"]] as const;
      const combinedResetKeys = [...resetKeys, ...signalResetKeys, ...broadSignalResetKeys];
      console.log("[DiscardDebug] reset exact query keys", { keys: combinedResetKeys });

      const resetPromises = combinedResetKeys.map((queryKey) => queryClient.resetQueries({ queryKey }));
      if (user?.id) {
        resetPromises.push(queryClient.resetQueries({ queryKey: queryKeys.workoutActiveSession(user.id) }));
      }
      await Promise.all(resetPromises);

      setExtraSetsByExercise({});
      setPendingCompletedSetKeys(new Set());
      setSetDrafts({});
      restTimer.reset();

      console.log("[DiscardDebug] after local reset", {
        sessionId,
        hasStartedSession: Boolean(sessionQuery.data?.session?.id)
      });

      console.log("[DiscardDebug] replacing to workout home");
      router.setParams({
        signalDayId: "",
        signalProgramId: "",
        signalWeekId: "",
        signalStepType: "",
        signalBlockIndex: "",
      });
      console.log("[SessionAudit][discard]", {
        queriesReset: true,
        routeParamsCleared: true,
        sessionId,
        status: result.status,
      });
      router.replace(SIGNAL_WORKOUT_HOME_HREF);
    } catch (error) {
      console.warn("[athlete-flow]", {
        error: error instanceof Error ? error.message : String(error),
        screen: "WorkoutPlayer",
        type: "discard-session-action",
      });
      workoutQuery.refetch();
      sessionQuery.refetch();
    }
  }

  const showSignalFooter =
    isSignalExecution && !isLoading && !hasError && !signalExecutionIssue && Boolean(workoutPlan) && Boolean(currentStep);
  const signalFooter = showSignalFooter ? (
    isSummaryStep ? (
      <SignalFooterPrimaryButton
        onPress={() => {
          restTimer.reset();
          router.replace("/(tabs)/workouts");
        }}
      >
        Done
      </SignalFooterPrimaryButton>
    ) : isReflectionStep ? (
      <View className="flex-row gap-3">
        <View className="flex-[0.42]">
          <SignalFooterSecondaryButton disabled={finishWorkoutMutation.isPending} onPress={handleSignalStepBack}>
            Back
          </SignalFooterSecondaryButton>
        </View>
        <View className="flex-1">
          <SignalFooterPrimaryButton
            isLoading={finishWorkoutMutation.isPending}
            onPress={handleFinishWorkout}
          >
            Finish Session
          </SignalFooterPrimaryButton>
        </View>
      </View>
    ) : isDoneTrainingStep ? (
      <View className="flex-row gap-3">
        <View className="flex-[0.52]">
          <SignalFooterSecondaryButton disabled={!canGoToPreviousSignalStep} onPress={handleSignalStepBack}>
            Back to Training
          </SignalFooterSecondaryButton>
        </View>
        <View className="flex-1">
          <SignalFooterPrimaryButton onPress={handleSignalStepPrimary}>
            Continue
          </SignalFooterPrimaryButton>
        </View>
      </View>
    ) : isWorkoutProgressStep ? (
      <View className="gap-3">
        {showRestTimerOptions && hasStartedSession ? (
          <View className="rounded-xl border border-white/10 bg-white/[0.04] p-2">
            {restTimer.isIdle || restTimer.isCompleted ? (
              <View className="gap-2">
                <View className="flex-row flex-wrap gap-2">
                  {[
                    { label: "30 sec", seconds: 30 },
                    { label: "60 sec", seconds: 60 },
                    { label: "90 sec", seconds: 90 },
                    { label: "2 min", seconds: 120 },
                  ].map((option) => (
                    <Pressable
                      accessibilityRole="button"
                      className="min-h-10 min-w-[72px] items-center justify-center rounded-lg border border-white/12 bg-white/[0.03] px-3"
                      key={option.seconds}
                      onPress={() => handleSignalTimerSelect(option.seconds)}
                    >
                      <Typography align="center" tone="inverse" variant="labelSm">
                        {option.label}
                      </Typography>
                    </Pressable>
                  ))}
                  <Pressable
                    accessibilityRole="button"
                    className="min-h-10 items-center justify-center rounded-lg border border-white/12 bg-white/[0.03] px-3"
                    onPress={() => setShowCustomTimerInput((current) => !current)}
                  >
                    <Typography align="center" tone="inverse" variant="labelSm">
                      Custom
                    </Typography>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    className="min-h-10 items-center justify-center rounded-lg border border-white/12 bg-transparent px-3"
                    onPress={() => {
                      setShowCustomTimerInput(false);
                      setShowRestTimerOptions(false);
                    }}
                  >
                    <Typography align="center" tone="secondary" variant="labelSm">
                      Cancel
                    </Typography>
                  </Pressable>
                </View>
                {showCustomTimerInput ? (
                  <View className="gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
                    <Typography tone="secondary" variant="labelSm">
                      CUSTOM TIMER IN SECONDS
                    </Typography>
                    <TextInput
                      keyboardType="number-pad"
                      onChangeText={setCustomTimerInput}
                      placeholder="Enter seconds (5-1800)"
                      placeholderTextColor="rgba(255,255,255,0.42)"
                      selectionColor={colors.emerald}
                      style={[styles.noteInputCompact, styles.noteInputSignal]}
                      value={customTimerInput}
                    />
                    <View className="flex-row gap-2">
                      <View className="flex-1">
                        <SignalFooterPrimaryButton
                          disabled={
                            !Number.isFinite(Number.parseInt(customTimerInput.trim(), 10)) ||
                            Number.parseInt(customTimerInput.trim(), 10) < 5 ||
                            Number.parseInt(customTimerInput.trim(), 10) > 60 * 30
                          }
                          onPress={handleStartCustomTimer}
                        >
                          Start Custom Timer
                        </SignalFooterPrimaryButton>
                      </View>
                      <View className="flex-[0.38]">
                        <SignalFooterSecondaryButton
                          onPress={() => {
                            setShowCustomTimerInput(false);
                            setCustomTimerInput("");
                          }}
                        >
                          Cancel
                        </SignalFooterSecondaryButton>
                      </View>
                    </View>
                  </View>
                ) : null}
              </View>
            ) : (
              <View className="flex-row flex-wrap gap-2">
                <Pressable
                  accessibilityRole="button"
                  className="min-h-10 min-w-[88px] items-center justify-center rounded-lg border border-white/12 bg-white/[0.03] px-3"
                  onPress={() => {
                    if (restTimer.isRunning) {
                      restTimer.pause();
                    } else if (restTimer.isPaused) {
                      restTimer.resume();
                    }
                    setShowRestTimerOptions(false);
                  }}
                >
                  <Typography align="center" tone="inverse" variant="labelSm">
                    {restTimer.isPaused ? "Resume" : "Pause"}
                  </Typography>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  className="min-h-10 min-w-[72px] items-center justify-center rounded-lg border border-white/12 bg-white/[0.03] px-3"
                  onPress={() => restTimer.addSeconds(30)}
                >
                  <Typography align="center" tone="inverse" variant="labelSm">
                    +30 sec
                  </Typography>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  className="min-h-10 min-w-[72px] items-center justify-center rounded-lg border border-white/12 bg-white/[0.03] px-3"
                  onPress={() => restTimer.subtractSeconds(30)}
                >
                  <Typography align="center" tone="inverse" variant="labelSm">
                    -30 sec
                  </Typography>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  className="min-h-10 min-w-[88px] items-center justify-center rounded-lg border border-white/12 bg-white/[0.03] px-3"
                  onPress={() => {
                    restTimer.stop();
                    setShowRestTimerOptions(false);
                  }}
                >
                  <Typography align="center" tone="inverse" variant="labelSm">
                    Stop Timer
                  </Typography>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  className="min-h-10 items-center justify-center rounded-lg border border-white/12 bg-transparent px-3"
                  onPress={() => setShowRestTimerOptions(false)}
                >
                  <Typography align="center" tone="secondary" variant="labelSm">
                    Cancel
                  </Typography>
                </Pressable>
              </View>
            )}
          </View>
        ) : null}
	        <View className="flex-row items-center gap-3">
          <View className="flex-[0.3]">
            <SignalFooterSecondaryButton disabled={!canGoToPreviousSignalStep} onPress={handleSignalStepBack}>
              Back
            </SignalFooterSecondaryButton>
          </View>
          <View className="flex-[0.4]">
            {!hasStartedSession ? (
              <SignalFooterPrimaryButton
                isLoading={startSessionMutation.isPending}
                onPress={handleSignalFooterCenterPress}
              >
                {signalCenterActionLabel}
              </SignalFooterPrimaryButton>
            ) : (
              <SignalFooterTimerButton onPress={handleSignalFooterCenterPress}>
                {signalCenterActionLabel}
              </SignalFooterTimerButton>
            )}
          </View>
          <View className="flex-[0.3]">
            <SignalFooterSecondaryButton disabled={false} onPress={handleSignalStepPrimary}>
              {signalRightActionLabel}
	            </SignalFooterSecondaryButton>
	          </View>
	        </View>
	      </View>
	    ) : (
	      <View />
	    )
  ) : null;

  return (
    <>
    <ScreenScaffold
      backgroundClassName={isSignalExecution ? "bg-graphite" : undefined}
      backgroundColor={isSignalExecution ? colors.graphite : undefined}
      bottomChrome={isSignalExecution ? "none" : "tabs"}
      contentClassName={cn("gap-gutter", isSignalExecution ? "pb-32" : null)}
      footerClassName={isSignalExecution ? "border-t border-white/10 bg-[#0f1316]/96" : undefined}
      footerMode={isSignalExecution ? "docked" : "default"}
      header={
        isSignalExecution ? signalHeaderNode : (
          <AppTopBar
            centered
            subtitle={(workoutPlan?.program.title ?? "Workout").toUpperCase()}
            taskMode
            title={workoutPlan?.day.title ?? workoutPlan?.program.title ?? "Workout"}
          />
        )
      }
      taskMode
      footer={
        showSignalFooter ? (
          <View className="px-0 pt-0.5">
            {signalFooter}
          </View>
        ) : hasStartedSession && !completionSummary && !isSignalExecution ? (
          <View
            className={cn(
              "border-t px-container pb-6 pt-4",
              isSignalExecution ? "border-white/10 bg-graphite/95" : "border-border bg-surface",
            )}
          >
            <AppButton
              disabled={!shouldEnableFooter}
              isLoading={finishWorkoutMutation.isPending}
              onPress={footerAction}
              size="lg"
              variant="primary"
            >
              {footerLabel}
            </AppButton>
          </View>
        ) : null
      }
    >
      <View className="gap-gutter px-container">
        {completionSummary && !isSignalExecution ? (
          <EditorialCard className="gap-5 py-5">
          <View className="items-center gap-2">
            <View className="h-14 w-14 items-center justify-center rounded-full bg-emerald/10">
              <Ionicons color={colors.emerald} name="checkmark-circle" size={34} />
            </View>
            <Typography tone="secondary" variant="labelSm">
              Workout Complete
            </Typography>
            <Typography variant="headlineXl">{completionSummary.programTitle}</Typography>
          </View>

          <ProgressBar progress={1} tone="accent" className="h-2" />

          <View className="gap-2 rounded-2xl bg-surface-muted p-4">
            <Typography variant="headlineLg">{completionSummary.completedWeekLabel}</Typography>
              <Typography tone="secondary" variant="bodyMd">
                {completionSummary.completedDayTitle}
              </Typography>
            </View>

            <View className="gap-3">
              <View className="flex-row items-center justify-between">
                <Typography tone="secondary" variant="bodyMd">
                  Exercises completed
                </Typography>
                <Typography variant="headlineLg">{completionSummary.completedExercises}</Typography>
              </View>
              <View className="flex-row items-center justify-between">
                <Typography tone="secondary" variant="bodyMd">
                  Sets completed
                </Typography>
                <Typography variant="headlineLg">{completionSummary.completedSets}</Typography>
              </View>
            </View>

            <View className="gap-2">
              <Typography tone="secondary" variant="labelSm">
                {completionSummary.progressUpdateNeedsRefresh
                  ? "Workout saved, but progress update needs refresh"
                  : completionSummary.isProgramCompleted
                    ? "Program completed"
                    : "Next workout"}
              </Typography>
              <Typography variant="bodyMd">
                {completionSummary.progressUpdateNeedsRefresh
                  ? "Please return to the dashboard to refresh your active program state."
                  : completionSummary.isProgramCompleted
                    ? "You completed every playable workout in this program."
                    : completionSummary.nextWorkout
                      ? `${completionSummary.nextWorkout.weekLabel} · ${completionSummary.nextWorkout.dayLabel}`
                      : "Next workout unavailable."}
              </Typography>
            </View>

            <View className="gap-3 pt-2">
              {completionSummary.nextWorkout && !completionSummary.progressUpdateNeedsRefresh && !completionSummary.isProgramCompleted ? (
                <AppButton
                  onPress={() => {
                    router.push({
                      pathname: "/(signal)/program/[programId]/week/[weekId]/day/[dayId]",
                      params: {
                        dayId: completionSummary.nextWorkout?.dayId ?? "",
                        programId: completionSummary.nextWorkout?.programId ?? "",
                        weekId: completionSummary.nextWorkout?.weekId ?? "",
                      },
                    });
                  }}
                >
                  View Next Workout
                </AppButton>
              ) : null}
              <AppButton
                onPress={() => {
                  router.replace("/(tabs)");
                }}
                variant={completionSummary.nextWorkout && !completionSummary.progressUpdateNeedsRefresh && !completionSummary.isProgramCompleted ? "secondary" : "primary"}
              >
                Back to Dashboard
              </AppButton>
            </View>
          </EditorialCard>
        ) : null}

        {signalExecutionIssue ? (
          <EditorialCard className="gap-3">
            <Typography variant="headlineLg">{signalExecutionIssue.title}</Typography>
            <Typography tone="secondary" variant="bodyMd">
              {signalExecutionIssue.body}
            </Typography>
            {signalExecutionIssue.retry ? (
              <AppButton onPress={() => signalWorkoutQuery.refetch()} variant="secondary">
                Retry
              </AppButton>
            ) : null}
          </EditorialCard>
        ) : null}

        {hasError ? (
          <EditorialCard className="gap-3">
            <Typography variant="headlineLg">Unable to load workout</Typography>
            <Typography tone="secondary" variant="bodyMd">
              Please try again in a moment.
            </Typography>
            <AppButton
              onPress={() => {
                enrollmentsQuery.refetch();
                workoutQuery.refetch();
                sessionQuery.refetch();
              }}
              variant="secondary"
            >
              Retry
            </AppButton>
          </EditorialCard>
        ) : null}

        {isLoading ? <WorkoutSkeleton /> : null}

        {!completionSummary && !isLoading && !hasError && !signalExecutionIssue && !hasWorkoutAccess ? (
          <EditorialCard className="gap-3">
            <Typography variant="headlineLg">No active program</Typography>
            <Typography tone="secondary" variant="bodyMd">
              Start a training protocol before opening workout execution.
            </Typography>
            <Link asChild href="/(marketplace)">
              <AppButton variant="secondary">Explore Programs</AppButton>
            </Link>
          </EditorialCard>
        ) : null}

        {!completionSummary && !isLoading && !hasError && !signalExecutionIssue && !workoutPlan && !isSignalExecution ? (
          <EditorialCard className="gap-3">
            <Typography variant="headlineLg">No active workout today</Typography>
            <Typography tone="secondary" variant="bodyMd">
              Your active protocol does not have a recoverable plan for today. It may be unpublished or missing today’s training day.
            </Typography>
            <View className="gap-2">
              <AppButton
                onPress={() => {
                  workoutQuery.refetch();
                  enrollmentsQuery.refetch();
                }}
                variant="secondary"
              >
                Retry
              </AppButton>
              <Link asChild href="/(marketplace)">
                <AppButton variant="ghost">Browse Training</AppButton>
              </Link>
            </View>
          </EditorialCard>
        ) : null}

        {!completionSummary && !isLoading && !hasError && !signalExecutionIssue && !isSignalExecution && workoutPlan && workoutPlan.exercises.length === 0 ? (
        <EditorialCard className="gap-3">
          <Typography variant="headlineLg">No exercises for this day</Typography>
          <Typography tone="secondary" variant="bodyMd">
            This training day has no programmed exercises yet.
          </Typography>
          <Link asChild href="/(marketplace)">
            <AppButton variant="secondary">Browse Training</AppButton>
          </Link>
        </EditorialCard>
      ) : null}

        {!completionSummary &&
        !isLoading &&
        !hasError &&
        !signalExecutionIssue &&
        workoutPlan &&
        workoutPlan.exercises.length > 0 &&
        !activeExercise &&
        !isSignalExecution ? (
        <EditorialCard className="gap-3">
          <Typography variant="headlineLg">Workout changed</Typography>
          <Typography tone="secondary" variant="bodyMd">
            This exercise is no longer available in the current program. Reload the workout to recover.
          </Typography>
          <AppButton onPress={() => workoutQuery.refetch()} variant="secondary">
            Retry
          </AppButton>
        </EditorialCard>
      ) : null}

        {!isLoading && !hasError && !signalExecutionIssue && isSignalExecution && signalCompletionSummary ? (
          <View className="gap-4">
            <View className="items-center gap-3 rounded-[32px] border border-white/10 bg-[#101417] px-5 py-6">
              <View className="h-14 w-14 items-center justify-center rounded-full bg-emerald/10">
                <Ionicons color={colors.emerald} name="checkmark-circle" size={34} />
              </View>
              <Typography tone="secondary" variant="labelSm">
                Workout Complete
              </Typography>
              <Typography align="center" tone="inverse" variant="headlineXl">
                {signalCompletionSummary.programTitle}
              </Typography>
              <Typography align="center" className="opacity-80" tone="inverse" variant="bodyMd">
                {signalCompletionSummary.completedWeekLabel} · {signalCompletionSummary.completedDayTitle}
              </Typography>
            </View>

            <View className="items-center gap-2 rounded-[28px] border border-white/10 bg-white/[0.04] px-5 py-6">
              <Typography className="tracking-[1px] opacity-75" tone="inverse" variant="labelSm">
                TOTAL VOLUME
              </Typography>
              <Typography align="center" tone="inverse" variant="headlineXl">
                {Math.round(signalLiveTotals.volumeLbs) > 0 ? `${Math.round(signalLiveTotals.volumeLbs)} LB` : "0 LB"}
              </Typography>
            </View>

            <View className="flex-row flex-wrap gap-3">
              {[
                { label: "Blocks completed", value: `${signalWorkoutBlockCount} / ${signalWorkoutBlockCount}` },
                { label: "Exercises", value: `${signalCompletionSummary.completedExercises}` },
                { label: "Sets", value: `${signalCompletionSummary.completedSets}` },
                { label: "Reps", value: `${signalLiveTotals.reps > 0 ? Math.round(signalLiveTotals.reps) : 0}` },
                { label: "Volume", value: `${Math.round(signalLiveTotals.volumeLbs)} LB` },
                { label: "Minutes", value: reflectionDurationMinutes.trim().length > 0 ? reflectionDurationMinutes.trim() : "--" },
                { label: "Intensity", value: `${reflectionIntensity}/10` },
              ].map((stat) => (
                <View
                  className="gap-1 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4"
                  style={{ width: "48%" }}
                  key={stat.label}
                >
                  <Typography className="opacity-75" tone="inverse" variant="labelSm">
                    {stat.label}
                  </Typography>
                  <Typography tone="inverse" variant="headlineLg">
                    {stat.value}
                  </Typography>
                </View>
              ))}
            </View>

            {signalCompletionSummary.progressUpdateNeedsRefresh ? (
              <Typography className="opacity-85" tone="inverse" variant="bodyMd">
                Workout saved, but progress update needs refresh.
              </Typography>
            ) : null}
          </View>
        ) : null}

        {!completionSummary && !isLoading && !hasError && !signalExecutionIssue && isSignalExecution && workoutPlan && currentStep ? (
            <View className="gap-4">
              <View className="gap-2">
                <View className="flex-row items-center gap-2">
                  {signalProgressSteps.map((step, index) => {
                  const isCurrent = index === signalProgressIndex;
                  const isCompleted = index < signalProgressIndex;
                  return (
                    <View
                      key={step.id}
                      className={cn(
                        "h-2 rounded-full",
                        isCurrent ? "w-8 bg-emerald" : isCompleted ? "w-2 bg-emerald/80" : "w-2 bg-white/20",
                      )}
                    />
                  );
                })}
              </View>

              <View className="flex-row items-center justify-between">
                <Typography className="tracking-[1px] opacity-75" tone="inverse" variant="labelSm">
                  {currentStepLabel ?? "STEP"}
                </Typography>
                <Typography className="opacity-90" tone="inverse" variant="labelSm">
                  {signalLiveTotals.sets > 0 ? `${signalLiveTotals.sets} ${signalLiveTotals.sets === 1 ? "SET" : "SETS"} · ` : ""}{Math.round(signalLiveTotals.reps)} REPS · {Math.round(signalLiveTotals.volumeLbs)} LB
                </Typography>
              </View>
              <ProgressBar className="h-1.5" progress={signalStepProgress} tone="accent" />
            </View>

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

                  {currentSignalBlockExercises.map((exerciseSection) => (
                    <View className="gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3.5" key={exerciseSection.payloadExercise.sync_key}>
                      <View className="flex-row items-start justify-between gap-3">
                        <View className="flex-1 gap-1">
                          <Typography tone="inverse" variant="bodyLg">
                            {exerciseSection.label} {exerciseSection.payloadExercise.exerciseName}
                          </Typography>
                          <Typography className="opacity-80" tone="inverse" variant="bodyMd">
                            {exerciseSection.workoutExercise
                              ? formatSignalWorkoutPrescriptionSummary(exerciseSection.workoutExercise.prescription) ??
                                formatSignalExercisePrescription(exerciseSection.payloadExercise) ??
                                "Log the prescribed sets below."
                              : formatSignalExercisePrescription(exerciseSection.payloadExercise) ?? "Log the prescribed sets below."}
                          </Typography>
                          {exerciseSection.workoutExercise?.prescription.notes ? (
                            <Typography className="opacity-72" tone="inverse" variant="bodyMd">
                              {exerciseSection.workoutExercise.prescription.notes}
                            </Typography>
                          ) : null}
                          {!exerciseSection.workoutExercise?.prescription.notes && exerciseSection.payloadExercise.notes?.trim() ? (
                            <Typography className="opacity-72" tone="inverse" variant="bodyMd">
                              {exerciseSection.payloadExercise.notes.trim()}
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
                              handleOpenCoachMedia({
                                thumbnailUrl: exerciseSection.demoThumbnailUrl,
                                title: exerciseSection.demoTitle,
                                url: exerciseSection.demoUrl,
                                videoId: exerciseSection.demoVideoId,
                              });
                              return;
                            }

                            Linking.openURL(exerciseSection.demoUrl).catch(() => {});
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
                            Linking.openURL(exerciseSection.demoUrl).catch(() => {});
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
                            <SetRowVariantD
                              completed={completed}
                              index={setNo}
                              isActive={isActiveSet}
                              isEditable={hasStartedSession && Boolean(exerciseSection.workoutExercise)}
                              key={draftKey}
                              lbsValue={draft.lbs}
                              onChangeLbs={(next) =>
                                setSetDrafts((current) => ({
                                  ...current,
                                  [draftKey]: { ...(current[draftKey] ?? { lbs: "", reps: "", rpe: "" }), lbs: next },
                                }))
                              }
                              onChangeReps={(next) =>
                                setSetDrafts((current) => ({
                                  ...current,
                                  [draftKey]: { ...(current[draftKey] ?? { lbs: "", reps: "", rpe: "" }), reps: next },
                                }))
                              }
                              onChangeRpe={(next) =>
                                setSetDrafts((current) => ({
                                  ...current,
                                  [draftKey]: { ...(current[draftKey] ?? { lbs: "", reps: "", rpe: "" }), rpe: next },
                                }))
                              }
                              onToggleComplete={() => {
                                if (!exerciseSection.workoutExercise) return;
                                handleCompleteSet(exerciseSection.workoutExercise, setNo);
                              }}
                              repsValue={displayedReps}
                              rpeValue={displayedRpe}
                              setLabel={`Set ${setNo}`}
                              signalMode
                              weightInputRef={(node) => {
                                setInputRefs.current[draftKey] = node;
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
                                setExtraSetsByExercise((current) => ({
                                  ...current,
                                  [exerciseSection.exerciseId]: Math.max(0, (current[exerciseSection.exerciseId] ?? 0) - 1),
                                }));
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
                              onPress={() => {
                                setExtraSetsByExercise((current) => ({
                                  ...current,
                                  [exerciseSection.exerciseId]: (current[exerciseSection.exerciseId] ?? 0) + 1,
                                }));
                              }}
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
                          onChangeText={(next) =>
                            setExerciseNotes((current) => ({
                              ...current,
                              [exerciseSection.exerciseId]: next,
                            }))
                          }
                          placeholder="Add a quick note"
                          placeholderTextColor="rgba(255,255,255,0.42)"
                          selectionColor={colors.emerald}
                          style={[styles.noteInputCompact, styles.noteInputSignal]}
                          value={exerciseSection.note}
                        />
                      </View>
                    </View>
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
                            onPress={() => setReflectionIntensity(value)}
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
                      onChangeText={setReflectionDurationMinutes}
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
                      onChangeText={setReflectionNote}
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
                    onPress={() => setShareWithCoachAndTeam((current) => !current)}
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

              {null}
            </View>

          </View>
        ) : null}

        {!completionSummary &&
        !isLoading &&
        !hasError &&
        !signalExecutionIssue &&
        !isSignalExecution &&
        workoutPlan &&
        workoutPlan.exercises.length > 0 &&
        activeExercise ? (
        <View className="gap-gutter">
          <View className="gap-4 rounded-[32px] border border-white/10 bg-white/[0.04] p-5">
            <View className="flex-row items-start justify-between gap-3">
              <View className="flex-1 gap-2">
                <Typography tone="secondary" variant="labelSm">
                  {activeExercise.exercise.primary_muscle ?? "Primary"}
                </Typography>
                <Typography tone="inverse" variant="headlineXl">{activeExercise.exercise.name}</Typography>
                <Typography tone="secondary" variant="bodyMd">
                  {activeExercise.prescription.notes ?? "Complete the exercises in this block, then continue."}
                </Typography>
              </View>
            </View>
          </View>
        </View>
      ) : null}
      </View>
    </ScreenScaffold>
    {coachMediaModalNode}
    </>
  );
}

export const WorkoutPlayerScreen = memo(WorkoutPlayerScreenComponent);
