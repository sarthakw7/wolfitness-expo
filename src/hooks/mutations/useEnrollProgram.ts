import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/src/hooks/queries/queryKeys";
import { useAuth } from "@/src/hooks/useAuth";
import { enrollmentService } from "@/src/services";

export function useEnrollProgram() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useMutation({
    mutationFn: async (programId: string) => {
      if (!userId) throw new Error("Not authenticated.");
      return enrollmentService.enrollInProgram({ programId, userId });
    },
    onSuccess: async () => {
      if (!userId) return;
      await queryClient.invalidateQueries({ queryKey: queryKeys.enrollments(userId) });
    },
  });
}

