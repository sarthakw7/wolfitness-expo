import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/src/hooks/queries/queryKeys";
import { useAuth } from "@/src/hooks/useAuth";
import { nutritionService } from "@/src/services";
import type { AddMealLogInput as AddMealLogServiceInput } from "@/src/services/nutrition.service";

type AddMealLogInput = Omit<AddMealLogServiceInput, "userId">;

function toIsoDate(date = new Date()) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function useAddMealLog() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useMutation({
    mutationFn: async (input: AddMealLogInput) => {
      if (!userId) throw new Error("Not authenticated.");
      return nutritionService.addMealLog({
        ...input,
        userId,
      });
    },
    onSuccess: async (_data, input) => {
      if (!userId) return;
      const date = input.loggedAt ?? toIsoDate();

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboardOverview(userId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.nutritionLogs(userId, date) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.nutritionSummary(userId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.progressOverview(userId, "7d") }),
        queryClient.invalidateQueries({ queryKey: queryKeys.progressOverview(userId, "30d") }),
      ]);
    },
  });
}
