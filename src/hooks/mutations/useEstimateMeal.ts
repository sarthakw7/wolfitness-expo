import { useMutation } from "@tanstack/react-query";

import { nutritionService } from "@/src/services";
import type { EstimateMealInput } from "@/src/services/nutrition.service";

export function useEstimateMeal() {
  return useMutation({
    mutationFn: async (input: EstimateMealInput) => {
      return nutritionService.estimateMeal(input);
    },
  });
}
