import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/src/hooks/queries/queryKeys";
import { useAuth } from "@/src/hooks/useAuth";
import { nutritionService } from "@/src/services";
import type { UpdateMacroTargetsInput as UpdateMacroTargetsServiceInput } from "@/src/services/nutrition.service";

type UpdateMacroTargetsInput = Omit<UpdateMacroTargetsServiceInput, "userId">;

export function useUpdateMacroTargets() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useMutation({
    mutationFn: async (input: UpdateMacroTargetsInput) => {
      if (!userId) throw new Error("Not authenticated.");
      return nutritionService.updateMacroTargets({
        ...input,
        userId,
      });
    },
    onSuccess: async () => {
      if (!userId) return;

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboardOverview(userId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.macroTargets(userId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.nutritionSummary(userId) }),
      ]);
    },
  });
}
