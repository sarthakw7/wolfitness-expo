import type { WolfAINutritionSuggestion } from "../types";

import { useWolfAISuggestion } from "./useWolfAISuggestion";

export function useNutritionSuggestions() {
  return useWolfAISuggestion<WolfAINutritionSuggestion>("nutrition");
}
