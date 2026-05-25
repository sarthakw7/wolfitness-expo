import { supabase } from "@/src/lib/supabase";

import type { Enrollment } from "./enrollment.service";
import type { Program } from "./programs.service";

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
  name: string;
  primary_muscle: string | null;
  video_url: string | null;
};

export type WorkoutExercise = {
  exercise: ExerciseLibraryRow;
  prescription: ProgramExerciseRow;
};

export type WorkoutPlanForToday = {
  day: ProgramDay;
  enrollment: Enrollment;
  exercises: WorkoutExercise[];
  program: Program;
  week: ProgramWeek;
};

export type WorkoutSession = {
  completed_at: string | null;
  day_id: string | null;
  id: string;
  notes: string | null;
  program_id: string | null;
  started_at: string;
  user_id: string;
};

export type WorkoutLogSet = {
  exercise_library_id: string;
  id: string;
  logged_at: string;
  reps_completed: number | null;
  rpe_actual: number | null;
  session_id: string;
  set_number: number;
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

function toIsoDate(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function mondayBasedDayNumber(date: Date) {
  const day = date.getDay(); // 0=Sun .. 6=Sat
  return day === 0 ? 7 : day;
}

function daysBetween(fromIso: string, to: Date) {
  const from = new Date(fromIso);
  if (Number.isNaN(from.getTime())) return 0;
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime();
  return Math.max(0, Math.floor((b - a) / (1000 * 60 * 60 * 24)));
}

export async function fetchWorkoutForToday(userId: string): Promise<WorkoutPlanForToday | null> {
  const activeEnrollmentRes = await supabase
    .from("enrollments")
    .select("id,user_id,program_id,status,stripe_subscription_id,enrolled_at,expires_at")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("enrolled_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (activeEnrollmentRes.error && activeEnrollmentRes.status !== 406) throw activeEnrollmentRes.error;
  const enrollment = (activeEnrollmentRes.data as Enrollment | null) ?? null;
  if (!enrollment) return null;

  const [programRes, weeksRes] = await Promise.all([
    supabase
      .from("programs")
      .select("id,creator_id,title,description,price,is_subscription,duration_weeks,difficulty,vibe_type,image_url,is_published,created_at")
      .eq("id", enrollment.program_id)
      .maybeSingle(),
    supabase
      .from("program_weeks")
      .select("id,program_id,week_number,title")
      .eq("program_id", enrollment.program_id)
      .order("week_number", { ascending: true }),
  ]);

  if (programRes.error && programRes.status !== 406) throw programRes.error;
  if (weeksRes.error) throw weeksRes.error;

  const program = (programRes.data as Program | null) ?? null;
  const weeks = (weeksRes.data as ProgramWeek[]) ?? [];
  if (!program || weeks.length === 0) return null;

  const today = new Date();
  const elapsedDays = daysBetween(enrollment.enrolled_at, today);
  const derivedWeek = Math.floor(elapsedDays / 7) + 1;
  const week = weeks.find((w) => w.week_number === derivedWeek) ?? weeks[0];

  const dayNumber = mondayBasedDayNumber(today);
  const daysRes = await supabase
    .from("program_days")
    .select("id,week_id,day_number,title")
    .eq("week_id", week.id)
    .order("day_number", { ascending: true });

  if (daysRes.error) throw daysRes.error;
  const days = (daysRes.data as ProgramDay[]) ?? [];
  if (days.length === 0) return null;

  const day = days.find((d) => d.day_number === dayNumber) ?? days[0];

  const exercisesRes = await supabase
    .from("program_exercises")
    .select("id,day_id,exercise_library_id,target_sets,target_reps,target_rpe,rest_seconds,notes,order_index")
    .eq("day_id", day.id)
    .order("order_index", { ascending: true });

  if (exercisesRes.error) throw exercisesRes.error;
  const prescriptionRows = (exercisesRes.data as ProgramExerciseRow[]) ?? [];

  if (prescriptionRows.length === 0) {
    return { day, enrollment, exercises: [], program, week };
  }

  const libIds = Array.from(new Set(prescriptionRows.map((row) => row.exercise_library_id)));
  const libraryRes = await supabase
    .from("exercises_library")
    .select("id,name,primary_muscle,video_url")
    .in("id", libIds);

  if (libraryRes.error) throw libraryRes.error;
  const libraryRows = (libraryRes.data as ExerciseLibraryRow[]) ?? [];
  const libraryMap = new Map(libraryRows.map((row) => [row.id, row]));

  const exercises = prescriptionRows
    .map((prescription) => {
      const exercise = libraryMap.get(prescription.exercise_library_id);
      if (!exercise) return null;
      return { exercise, prescription };
    })
    .filter((item): item is WorkoutExercise => Boolean(item));

  return { day, enrollment, exercises, program, week };
}

export async function getOrCreateWorkoutSession(input: {
  dayId: string;
  programId: string;
  userId: string;
}): Promise<WorkoutSession> {
  const openRes = await supabase
    .from("workout_sessions")
    .select("id,user_id,program_id,day_id,started_at,completed_at,notes")
    .eq("user_id", input.userId)
    .eq("program_id", input.programId)
    .eq("day_id", input.dayId)
    .is("completed_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (openRes.error && openRes.status !== 406) throw openRes.error;
  if (openRes.data) return openRes.data as WorkoutSession;

  // One active session per day/program.
  const todayIso = toIsoDate(new Date());
  const dayStart = `${todayIso}T00:00:00.000Z`;
  const dayEnd = `${todayIso}T23:59:59.999Z`;
  const todayRes = await supabase
    .from("workout_sessions")
    .select("id,user_id,program_id,day_id,started_at,completed_at,notes")
    .eq("user_id", input.userId)
    .eq("program_id", input.programId)
    .is("completed_at", null)
    .gte("started_at", dayStart)
    .lte("started_at", dayEnd)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (todayRes.error && todayRes.status !== 406) throw todayRes.error;
  if (todayRes.data) return todayRes.data as WorkoutSession;

  const insertRes = await supabase
    .from("workout_sessions")
    .insert({
      day_id: input.dayId,
      program_id: input.programId,
      user_id: input.userId,
    })
    .select("id,user_id,program_id,day_id,started_at,completed_at,notes")
    .single();

  if (insertRes.error) throw insertRes.error;
  return insertRes.data as WorkoutSession;
}

export async function findActiveWorkoutSession(input: {
  dayId: string;
  programId: string;
  userId: string;
}): Promise<WorkoutSession | null> {
  const openRes = await supabase
    .from("workout_sessions")
    .select("id,user_id,program_id,day_id,started_at,completed_at,notes")
    .eq("user_id", input.userId)
    .eq("program_id", input.programId)
    .eq("day_id", input.dayId)
    .is("completed_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (openRes.error && openRes.status !== 406) throw openRes.error;
  if (openRes.data) return openRes.data as WorkoutSession;

  const todayIso = toIsoDate(new Date());
  const dayStart = `${todayIso}T00:00:00.000Z`;
  const dayEnd = `${todayIso}T23:59:59.999Z`;
  const todayRes = await supabase
    .from("workout_sessions")
    .select("id,user_id,program_id,day_id,started_at,completed_at,notes")
    .eq("user_id", input.userId)
    .eq("program_id", input.programId)
    .is("completed_at", null)
    .gte("started_at", dayStart)
    .lte("started_at", dayEnd)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (todayRes.error && todayRes.status !== 406) throw todayRes.error;
  return (todayRes.data as WorkoutSession | null) ?? null;
}

export async function fetchWorkoutLogSets(sessionId: string): Promise<WorkoutLogSet[]> {
  const { data, error } = await supabase
    .from("workout_log_sets")
    .select("id,session_id,exercise_library_id,set_number,reps_completed,weight_kg,rpe_actual,logged_at")
    .eq("session_id", sessionId)
    .order("set_number", { ascending: true })
    .order("logged_at", { ascending: true });
  if (error) throw error;
  return (data as WorkoutLogSet[]) ?? [];
}

export async function completeSet(input: {
  exerciseLibraryId: string;
  repsCompleted?: number | null;
  rpeActual?: number | null;
  sessionId: string;
  setNumber: number;
  weightKg?: number | null;
}): Promise<WorkoutLogSet> {
  // Guard duplicate logs by session+exercise+set_number.
  const existingRes = await supabase
    .from("workout_log_sets")
    .select("id,session_id,exercise_library_id,set_number,reps_completed,weight_kg,rpe_actual,logged_at")
    .eq("session_id", input.sessionId)
    .eq("exercise_library_id", input.exerciseLibraryId)
    .eq("set_number", input.setNumber)
    .maybeSingle();

  if (existingRes.error && existingRes.status !== 406) throw existingRes.error;
  if (existingRes.data) return existingRes.data as WorkoutLogSet;

  const insertRes = await supabase
    .from("workout_log_sets")
    .insert({
      exercise_library_id: input.exerciseLibraryId,
      reps_completed: input.repsCompleted ?? null,
      rpe_actual: input.rpeActual ?? null,
      session_id: input.sessionId,
      set_number: input.setNumber,
      weight_kg: input.weightKg ?? null,
    })
    .select("id,session_id,exercise_library_id,set_number,reps_completed,weight_kg,rpe_actual,logged_at")
    .single();

  if (insertRes.error) throw insertRes.error;
  return insertRes.data as WorkoutLogSet;
}

export async function finishWorkoutSession(sessionId: string): Promise<void> {
  const { data, error } = await supabase
    .from("workout_sessions")
    .update({ completed_at: new Date().toISOString() })
    .eq("id", sessionId)
    .is("completed_at", null)
    .select("id")
    .maybeSingle();

  if (error) throw error;
  if (!data?.id) {
    throw new Error("Workout completion could not be persisted because the active session is no longer available.");
  }
}

export async function fetchProgramStructure(programId: string): Promise<ProgramWeekPreview[]> {
  const weeksRes = await supabase
    .from("program_weeks")
    .select("id,program_id,week_number,title")
    .eq("program_id", programId)
    .order("week_number", { ascending: true });
  if (weeksRes.error) throw weeksRes.error;
  const weeks = (weeksRes.data as ProgramWeek[]) ?? [];
  if (!weeks.length) return [];

  const weekIds = weeks.map((w) => w.id);
  const daysRes = await supabase
    .from("program_days")
    .select("id,week_id,day_number,title")
    .in("week_id", weekIds)
    .order("day_number", { ascending: true });
  if (daysRes.error) throw daysRes.error;
  const days = (daysRes.data as ProgramDay[]) ?? [];
  if (!days.length) {
    return weeks.map((w) => ({ ...w, days: [] }));
  }

  const dayIds = days.map((d) => d.id);
  const exercisesRes = await supabase
    .from("program_exercises")
    .select("id,day_id,exercise_library_id,target_sets,target_reps,target_rpe,rest_seconds,notes,order_index")
    .in("day_id", dayIds)
    .order("order_index", { ascending: true });
  if (exercisesRes.error) throw exercisesRes.error;
  const prescriptions = (exercisesRes.data as ProgramExerciseRow[]) ?? [];

  const libraryIds = Array.from(new Set(prescriptions.map((p) => p.exercise_library_id)));
  const libraryMap = new Map<string, ExerciseLibraryRow>();
  if (libraryIds.length) {
    const libraryRes = await supabase
      .from("exercises_library")
      .select("id,name,primary_muscle,video_url")
      .in("id", libraryIds);
    if (libraryRes.error) throw libraryRes.error;
    ((libraryRes.data as ExerciseLibraryRow[]) ?? []).forEach((row) => {
      libraryMap.set(row.id, row);
    });
  }

  const exercisesByDay = new Map<string, ProgramExercisePreview[]>();
  prescriptions.forEach((p) => {
    const lib = libraryMap.get(p.exercise_library_id);
    const row: ProgramExercisePreview = {
      name: lib?.name ?? "Exercise",
      notes: p.notes,
      order_index: p.order_index,
      rest_seconds: p.rest_seconds,
      target_reps: p.target_reps,
      target_sets: p.target_sets,
    };
    const current = exercisesByDay.get(p.day_id) ?? [];
    current.push(row);
    exercisesByDay.set(p.day_id, current);
  });

  const daysByWeek = new Map<string, ProgramDayPreview[]>();
  days.forEach((d) => {
    const row: ProgramDayPreview = {
      day_number: d.day_number,
      id: d.id,
      title: d.title,
      week_id: d.week_id,
      exercises: exercisesByDay.get(d.id) ?? [],
    };
    const current = daysByWeek.get(d.week_id) ?? [];
    current.push(row);
    daysByWeek.set(d.week_id, current);
  });

  return weeks.map((w) => ({
    ...w,
    days: (daysByWeek.get(w.id) ?? []).sort((a, b) => a.day_number - b.day_number),
  }));
}
