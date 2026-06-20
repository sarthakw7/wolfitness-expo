export type ProgramSummary = {
  coverImage: string | null;
  difficulty: string;
  duration: string;
  goal: string;
  id: string;
  subtitle: string | null;
  title: string;
};

export type WorkoutProgramPayloadExercise = {
  exerciseId: string;
  exerciseName: string;
  id: string;
  media: string[];
  notes: string;
  position: number;
  sync_key: string;
  reps: string;
  rest: string;
  rpe: string;
  sets: string;
};

export type WorkoutProgramPayloadBlock = {
  description: string | null;
  exercises: WorkoutProgramPayloadExercise[];
  id: string;
  position: number;
  sync_key: string;
  title: string;
};

export type WorkoutProgramPayloadDay = {
  blocks: WorkoutProgramPayloadBlock[];
  id: string;
  position: number;
  sync_key: string;
  title: string;
};

export type WorkoutProgramPayloadWeek = {
  days: WorkoutProgramPayloadDay[];
  id: string;
  position: number;
  sync_key: string;
  title: string;
};

export type WorkoutProgramPayload = {
  program: ProgramSummary;
  weeks: WorkoutProgramPayloadWeek[];
};

type ProgramsErrorCode = "BAD_REQUEST" | "CONFIGURATION_ERROR" | "INTERNAL_ERROR" | "NOT_FOUND" | "PARSE_ERROR";

export class ProgramsError extends Error {
  code: ProgramsErrorCode;

  constructor(message: string, code: ProgramsErrorCode = "INTERNAL_ERROR") {
    super(message);
    this.code = code;
    this.name = "ProgramsError";
  }
}

function getExpoApiBaseUrl() {
  return process.env.EXPO_PUBLIC_API_URL?.trim() ?? "";
}

function resolveSignalApiUrl(path: string) {
  const baseUrl = getExpoApiBaseUrl();

  if (!baseUrl) {
    throw new ProgramsError(
      "API URL is not configured. Set EXPO_PUBLIC_API_URL to your Signal backend.",
      "CONFIGURATION_ERROR",
    );
  }

  return `${baseUrl.replace(/\/$/, "")}${path}`;
}

function normalizeError(error: unknown, fallbackMessage: string) {
  if (error instanceof ProgramsError) return error;
  if (error instanceof Error) return new ProgramsError(error.message || fallbackMessage);
  return new ProgramsError(fallbackMessage);
}

async function readJsonResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      (payload && typeof payload === "object" && "message" in payload && typeof (payload as { message?: unknown }).message === "string"
        ? (payload as { message: string }).message
        : null) ??
      (payload && typeof payload === "object" && "error" in payload && typeof (payload as { error?: unknown }).error === "string"
        ? (payload as { error: string }).error
        : null) ??
      `Request failed with status ${response.status}.`;

    if (response.status === 404) {
      throw new ProgramsError(message, "NOT_FOUND");
    }

    throw new ProgramsError(message);
  }

  if (payload == null) {
    throw new ProgramsError("Response body was empty.", "PARSE_ERROR");
  }

  return payload as T;
}

function assertString(value: unknown, fallback: string) {
  return typeof value === "string" ? value : fallback;
}

function assertNullableString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function assertArrayOfStrings(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function normalizeProgramSummary(value: unknown): ProgramSummary {
  if (!value || typeof value !== "object") {
    throw new ProgramsError("Program list response was malformed.", "PARSE_ERROR");
  }

  const candidate = value as Partial<ProgramSummary>;

  if (typeof candidate.id !== "string" || typeof candidate.title !== "string") {
    throw new ProgramsError("Program list response was malformed.", "PARSE_ERROR");
  }

  return {
    id: candidate.id,
    title: candidate.title,
    subtitle: assertNullableString(candidate.subtitle),
    coverImage: assertNullableString(candidate.coverImage),
    difficulty: assertString(candidate.difficulty, "Unknown"),
    duration: assertString(candidate.duration, "Ongoing"),
    goal: assertString(candidate.goal, "Performance"),
  };
}

function normalizeWorkoutProgramPayload(value: unknown): WorkoutProgramPayload {
  if (!value || typeof value !== "object") {
    throw new ProgramsError("Workout program response was malformed.", "PARSE_ERROR");
  }

  const candidate = value as Partial<WorkoutProgramPayload> & {
    program?: Partial<ProgramSummary>;
  };

  if (!candidate.program || typeof candidate.program !== "object" || !Array.isArray(candidate.weeks)) {
    throw new ProgramsError("Workout program response was malformed.", "PARSE_ERROR");
  }

  const program = normalizeProgramSummary(candidate.program);

  return {
    program,
    weeks: candidate.weeks.map((week) => {
      if (!week || typeof week !== "object") {
        throw new ProgramsError("Workout program response was malformed.", "PARSE_ERROR");
      }

      const weekCandidate = week as Partial<WorkoutProgramPayloadWeek>;
      if (typeof weekCandidate.id !== "string" || typeof weekCandidate.title !== "string" || !Array.isArray(weekCandidate.days)) {
        throw new ProgramsError("Workout program response was malformed.", "PARSE_ERROR");
      }

      return {
        id: weekCandidate.id,
        title: weekCandidate.title,
        position: typeof weekCandidate.position === "number" ? weekCandidate.position : 0,
        sync_key: assertString(weekCandidate.sync_key, weekCandidate.id),
        days: weekCandidate.days.map((day) => {
          if (!day || typeof day !== "object") {
            throw new ProgramsError("Workout program response was malformed.", "PARSE_ERROR");
          }

          const dayCandidate = day as Partial<WorkoutProgramPayloadDay>;
          if (typeof dayCandidate.id !== "string" || typeof dayCandidate.title !== "string" || !Array.isArray(dayCandidate.blocks)) {
            throw new ProgramsError("Workout program response was malformed.", "PARSE_ERROR");
          }

          return {
            id: dayCandidate.id,
            title: dayCandidate.title,
            position: typeof dayCandidate.position === "number" ? dayCandidate.position : 0,
            sync_key: assertString(dayCandidate.sync_key, dayCandidate.id),
            blocks: dayCandidate.blocks.map((block) => {
              if (!block || typeof block !== "object") {
                throw new ProgramsError("Workout program response was malformed.", "PARSE_ERROR");
              }

              const blockCandidate = block as Partial<WorkoutProgramPayloadBlock>;
              if (
                typeof blockCandidate.id !== "string" ||
                typeof blockCandidate.title !== "string" ||
                !Array.isArray(blockCandidate.exercises)
              ) {
                throw new ProgramsError("Workout program response was malformed.", "PARSE_ERROR");
              }

              return {
                id: blockCandidate.id,
                title: blockCandidate.title,
                description: assertNullableString(blockCandidate.description),
                position: typeof blockCandidate.position === "number" ? blockCandidate.position : 0,
                sync_key: assertString(blockCandidate.sync_key, blockCandidate.id),
                exercises: blockCandidate.exercises.map((exercise) => {
                  if (!exercise || typeof exercise !== "object") {
                    throw new ProgramsError("Workout program response was malformed.", "PARSE_ERROR");
                  }

                  const exerciseCandidate = exercise as Partial<WorkoutProgramPayloadExercise>;
                  if (
                    typeof exerciseCandidate.id !== "string" ||
                    typeof exerciseCandidate.exerciseId !== "string" ||
                    typeof exerciseCandidate.exerciseName !== "string"
                  ) {
                    throw new ProgramsError("Workout program response was malformed.", "PARSE_ERROR");
                  }

                  return {
                    id: exerciseCandidate.id,
                    exerciseId: exerciseCandidate.exerciseId,
                    exerciseName: exerciseCandidate.exerciseName,
                    media: assertArrayOfStrings(exerciseCandidate.media),
                    notes: assertString(exerciseCandidate.notes, ""),
                    position: typeof exerciseCandidate.position === "number" ? exerciseCandidate.position : 0,
                    sync_key: assertString(exerciseCandidate.sync_key, exerciseCandidate.id),
                    reps: assertString(exerciseCandidate.reps, ""),
                    rest: assertString(exerciseCandidate.rest, ""),
                    rpe: assertString(exerciseCandidate.rpe, ""),
                    sets: assertString(exerciseCandidate.sets, ""),
                  };
                }),
              };
            }),
          };
        }),
      };
    }),
  };
}

export async function getPrograms(): Promise<ProgramSummary[]> {
  try {
    const response = await fetch(resolveSignalApiUrl("/api/programs"), {
      headers: {
        Accept: "application/json",
      },
      method: "GET",
    });

    const payload = await readJsonResponse<unknown>(response);
    if (!Array.isArray(payload)) {
      throw new ProgramsError("Program list response was malformed.", "PARSE_ERROR");
    }

    return payload.map(normalizeProgramSummary);
  } catch (error) {
    throw normalizeError(error, "Unable to fetch programs.");
  }
}

export async function getWorkoutProgram(programId: string): Promise<WorkoutProgramPayload> {
  try {
    if (!programId.trim()) {
      throw new ProgramsError("Program ID is required.", "BAD_REQUEST");
    }

    const response = await fetch(resolveSignalApiUrl(`/api/workout-programs/${encodeURIComponent(programId)}`), {
      headers: {
        Accept: "application/json",
      },
      method: "GET",
    });

    const payload = await readJsonResponse<unknown>(response);
    return normalizeWorkoutProgramPayload(payload);
  } catch (error) {
    throw normalizeError(error, "Unable to fetch workout program.");
  }
}
