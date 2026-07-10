import type { WolfAIDailyGoalInsight } from "../types";

import { useWolfAISuggestion } from "./useWolfAISuggestion";

export function useDailyGoalInsight() {
  return useWolfAISuggestion<WolfAIDailyGoalInsight>("daily_goal");
}
