import type { WolfAIRecoverySuggestion } from "../types";

import { useWolfAISuggestion } from "./useWolfAISuggestion";

export function useRecoverySuggestions() {
  return useWolfAISuggestion<WolfAIRecoverySuggestion>("recovery");
}
