export const queryKeys = {
  dashboardOverview: (userId: string) => ["dashboard", "overview", userId] as const,
  enrollments: (userId: string) => ["enrollments", userId] as const,
  profile: (userId: string) => ["profile", userId] as const,
  program: (programId: string) => ["programs", "detail", programId] as const,
  programs: (filters: { creatorId?: string; publishedOnly?: boolean } = {}) =>
    ["programs", "list", filters] as const,
} as const;

