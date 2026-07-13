import type { WorkoutExerciseMedia } from "@/src/lib/youtube-media";
import type { Enrollment } from "@/src/services/enrollment.service";
import type { Program } from "@/src/services/programs.service";

export type ProgramWeek = {
  id: string;
  program_id: string;
  title: string | null;
  week_number: number;
};

export type ProgramDay = {
  day_number: number;
  id: string;
  title: string | null;
  week_id: string;
};

export type ProgramExerciseRow = {
  day_id: string;
  exercise_library_id: string;
  id: string;
  notes: string | null;
  order_index: number | null;
  rest_seconds: number | null;
  target_reps: string | null;
  target_rpe: number | null;
  target_sets: number | null;
};

export type ExerciseLibraryRow = {
  id: string;
  media_items?: WorkoutExerciseMedia[] | null;
  name: string;
  primary_muscle: string | null;
  thumbnail_url?: string | null;
  video_id?: string | null;
  video_provider?: string | null;
  video_title?: string | null;
  video_url: string | null;
};

export type WorkoutExercise = {
  exercise: ExerciseLibraryRow;
  prescription: ProgramExerciseRow;
  source_exercise_key?: string | null;
};

export type WorkoutPlanForToday = {
  day: ProgramDay;
  enrollment: Enrollment;
  exercises: WorkoutExercise[];
  program: Program;
  source_day_key?: string | null;
  source_week_key?: string | null;
  week: ProgramWeek;
};

export type WorkoutSession = {
  completed_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  day_id: string | null;
  active_program_id: string | null;
  id: string;
  notes: string | null;
  program_id: string | null;
  source: "legacy" | "signal" | null;
  source_day_key: string | null;
  source_program_id: string | null;
  source_program_version: string | null;
  source_week_key: string | null;
  started_at: string;
  user_id: string;
};

export type WorkoutSessionLookupInput =
  | {
      dayId: string;
      programId: string;
      userId: string;
      source?: "legacy" | null;
    }
  | {
      activeProgramId?: string | null;
      dayId?: null;
      programId?: null;
      source: "signal";
      sourceDayKey: string;
      sourceProgramId: string;
      sourceProgramVersion?: string | null;
      sourceWeekKey: string;
      userId: string;
    };

export type WorkoutSessionCreateInput = WorkoutSessionLookupInput;

export type SignalWorkoutSessionScope = {
  activeProgramId: string;
  sourceDayKey: string;
  sourceProgramId: string;
  sourceProgramVersion: string | null;
  sourceWeekKey: string;
};

export type SignalWorkoutSessionQueryInput = SignalWorkoutSessionScope & {
  userId: string;
};

export type WorkoutLogSet = {
  exercise_library_id: string | null;
  exercise_name?: string | null;
  id: string;
  logged_at: string;
  reps_completed: number | null;
  rpe_actual: number | null;
  session_id: string;
  set_number: number;
  source_exercise_key?: string | null;
  weight_kg: number | null;
};

export type ProgramExercisePreview = {
  name: string;
  notes: string | null;
  order_index: number | null;
  rest_seconds: number | null;
  target_reps: string | null;
  target_sets: number | null;
};

export type ProgramDayPreview = {
  day_number: number;
  id: string;
  title: string | null;
  week_id: string;
  exercises: ProgramExercisePreview[];
};

export type ProgramWeekPreview = {
  id: string;
  program_id: string;
  title: string | null;
  week_number: number;
  days: ProgramDayPreview[];
};
