import { useMutation } from "@tanstack/react-query";

import { nutritionService } from "@/src/services";
import type { NutritionCoachInput } from "@/src/services/nutrition.service";

export function useNutritionCoach() {
  return useMutation({
    mutationFn: async (input: NutritionCoachInput) => {
      return nutritionService.askNutritionCoach(input);
    },
  });
}
