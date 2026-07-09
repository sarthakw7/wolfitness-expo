export const WOLF_AI_FEATURES = {
  dailyGoal: "daily_goal",
  nutrition: "nutrition",
  recovery: "recovery",
} as const;

export const WOLF_AI_TIER_LIMITS = {
  elite: 50,
  free: 5,
  pro: 15,
} as const;

export const WOLF_AI_QUERY_KEYS = {
  usage: (userId: string, feature: string) => ["wolf-ai", "usage", userId, feature] as const,
} as const;

export const WOLF_AI_USAGE_MESSAGE = {
  limitReached: "You’ve used today’s Wolf AI actions. Your limit resets tomorrow.",
} as const;

export const WOLF_AI_ERROR_MESSAGES = {
  authentication: "You must be signed in to use Wolf AI.",
  network: "Wolf AI couldn’t refresh right now. Your latest guidance is still available.",
  limitReached: "You’ve used today’s Wolf AI actions. Your limit resets tomorrow.",
  unknown: "Wolf AI couldn’t complete that request.",
} as const;
