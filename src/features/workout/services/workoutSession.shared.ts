import type { WorkoutSessionLookupInput } from "@/src/features/workout/services/workoutTypes";

export function isSignalWorkoutSessionInput(
  input: WorkoutSessionLookupInput,
): input is Extract<WorkoutSessionLookupInput, { source: "signal" }> {
  return input.source === "signal";
}

export function workoutSessionSelect() {
  return "id,user_id,program_id,day_id,source,source_program_id,source_program_version,source_week_key,source_day_key,active_program_id,started_at,completed_at,cancelled_at,cancel_reason,notes";
}

export function applySignalProgramVersionFilter<
  T extends {
    eq: (column: string, value: string) => T;
    is: (column: string, value: null) => T;
  },
>(query: T, sourceProgramVersion: string | null | undefined) {
  return sourceProgramVersion
    ? query.eq("source_program_version", sourceProgramVersion)
    : query.is("source_program_version", null);
}
