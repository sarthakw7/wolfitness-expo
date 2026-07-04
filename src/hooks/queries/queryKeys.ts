export const queryKeys = {
  dashboardOverview: (userId: string) => ["dashboard", "overview", userId] as const,
  enrollments: (userId: string) => ["enrollments", userId] as const,
  macroTargets: (userId: string) => ["nutrition", "targets", userId] as const,
  nutritionLogs: (userId: string, date: string) => ["nutrition", "logs", userId, date] as const,
  nutritionSummary: (userId: string) => ["nutrition", "summary", userId] as const,
  profile: (userId: string) => ["profile", userId] as const,
  progressOverview: (userId: string, range: string) => ["progress", "overview", userId, range] as const,
  workoutHistory: (userId: string) => ["workout-history", userId] as const,
  signalProgramProgress: (userId: string, versionId?: string | null) =>
    ["signal", "program-progress", userId, versionId ?? "latest"] as const,
  program: (programId: string) => ["programs", "detail", programId] as const,
  programs: (filters: { creatorId?: string; publishedOnly?: boolean } = {}) =>
    ["programs", "list", filters] as const,
  programStructure: (programId: string) => ["programs", "structure", programId] as const,
  workout: (userId: string) => ["workout", "active", userId] as const,
  workoutActiveSession: (userId: string) => ["workout", "active-session", userId] as const,
  workoutSessionDetail: (userId: string, sessionId: string) =>
    ["workout-session-detail", userId, sessionId] as const,
  workoutSessionStatuses: () => ["workout", "session-status"] as const,
  workoutSessionStatus: (userId: string, programId: string, dayId: string) =>
    ["workout", "session-status", userId, programId, dayId] as const,
  workoutSessionPlans: () => ["workout", "session-plan"] as const,
  workoutSessionPlan: (userId: string, programId: string, dayId: string) =>
    ["workout", "session-plan", userId, programId, dayId] as const,
  signalWorkoutSession: (
    userId: string,
    activeProgramId: string,
    sourceProgramId: string,
    sourceProgramVersion: string | null,
    sourceWeekKey: string,
    sourceDayKey: string,
  ) =>
    [
      "workout",
      "signal-session",
      userId,
      activeProgramId,
      sourceProgramId,
      sourceProgramVersion ?? "legacy-null",
      sourceWeekKey,
      sourceDayKey,
    ] as const,
  signalWorkoutSessionPlan: (
    userId: string,
    activeProgramId: string,
    sourceProgramId: string,
    sourceProgramVersion: string | null,
    sourceWeekKey: string,
    sourceDayKey: string,
  ) =>
    [
      "workout",
      "signal-session-plan",
      userId,
      activeProgramId,
      sourceProgramId,
      sourceProgramVersion ?? "legacy-null",
      sourceWeekKey,
      sourceDayKey,
    ] as const,
  signalWorkoutSessionStatus: (
    userId: string,
    activeProgramId: string,
    sourceProgramId: string,
    sourceProgramVersion: string | null,
    sourceWeekKey: string,
    sourceDayKey: string,
  ) =>
    [
      "workout",
      "signal-session-status",
      userId,
      activeProgramId,
      sourceProgramId,
      sourceProgramVersion ?? "legacy-null",
      sourceWeekKey,
      sourceDayKey,
    ] as const,
  workoutSession: (sessionId: string) => ["workout", "session", sessionId] as const,
} as const;
