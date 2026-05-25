export const queryKeys = {
  dashboardOverview: (userId: string) => ["dashboard", "overview", userId] as const,
  enrollments: (userId: string) => ["enrollments", userId] as const,
  profile: (userId: string) => ["profile", userId] as const,
  program: (programId: string) => ["programs", "detail", programId] as const,
  programs: (filters: { creatorId?: string; publishedOnly?: boolean } = {}) =>
    ["programs", "list", filters] as const,
  programStructure: (programId: string) => ["programs", "structure", programId] as const,
  workout: (userId: string) => ["workout", "active", userId] as const,
  workoutSessionStatuses: () => ["workout", "session-status"] as const,
  workoutSessionStatus: (userId: string, programId: string, dayId: string) =>
    ["workout", "session-status", userId, programId, dayId] as const,
  workoutSessionPlans: () => ["workout", "session-plan"] as const,
  workoutSessionPlan: (userId: string, programId: string, dayId: string) =>
    ["workout", "session-plan", userId, programId, dayId] as const,
  workoutSession: (sessionId: string) => ["workout", "session", sessionId] as const,
} as const;
