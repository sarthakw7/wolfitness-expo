import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/src/hooks/queries/queryKeys";
import { useAuth } from "@/src/hooks/useAuth";
import { nutritionService } from "@/src/services";

function toIsoDate(date = new Date()) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function useNutritionLogs(date = toIsoDate()) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useQuery({
    enabled: Boolean(userId),
    queryKey: userId ? queryKeys.nutritionLogs(userId, date) : (["nutrition", "logs", "anonymous", date] as const),
    queryFn: async () => {
      if (!userId) throw new Error("Not authenticated.");
      return nutritionService.fetchNutritionLogs(userId, date);
    },
    staleTime: 1000 * 30,
  });
}
