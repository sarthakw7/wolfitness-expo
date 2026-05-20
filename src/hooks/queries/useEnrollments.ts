import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/src/hooks/queries/queryKeys";
import { useAuth } from "@/src/hooks/useAuth";
import { enrollmentService } from "@/src/services";

export function useEnrollments() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useQuery({
    enabled: Boolean(userId),
    queryKey: userId ? queryKeys.enrollments(userId) : (["enrollments", "anonymous"] as const),
    queryFn: async () => {
      if (!userId) throw new Error("Not authenticated.");
      return enrollmentService.fetchEnrollments(userId);
    },
    staleTime: 1000 * 30,
  });
}

