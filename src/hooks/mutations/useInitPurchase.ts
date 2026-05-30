import { useMutation } from "@tanstack/react-query";

import { purchaseService } from "@/src/services";

export function useInitPurchase() {
  return useMutation({
    mutationFn: async (input: { cancelUrl?: string; programId: string; successUrl?: string }) => {
      return purchaseService.initPurchase(input);
    },
  });
}
