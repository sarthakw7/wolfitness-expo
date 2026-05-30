import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/src/hooks/queries/queryKeys";
import { useAuth } from "@/src/hooks/useAuth";
import { nutritionService } from "@/src/services";

export function useMacroTargets() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useQuery({
    enabled: Boolean(userId),
    queryKey: userId ? queryKeys.macroTargets(userId) : (["nutrition", "targets", "anonymous"] as const),
    queryFn: async () => {
      if (!userId) throw new Error("Not authenticated.");
      return nutritionService.fetchMacroTargets(userId);
    },
    staleTime: 1000 * 60 * 5,
  });
}
