import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/src/hooks/queries/queryKeys";
import { useAuth } from "@/src/hooks/useAuth";
import { progressService } from "@/src/services";

export function useSignalProgramProgress(userId?: string, versionId?: string | null) {
  const { user } = useAuth();
  const resolvedUserId = userId ?? user?.id ?? null;

  return useQuery({
    enabled: Boolean(resolvedUserId),
    queryKey: resolvedUserId
      ? queryKeys.signalProgramProgress(resolvedUserId, versionId)
      : (["signal", "program-progress", "anonymous"] as const),
    queryFn: async () => {
      if (!resolvedUserId) return null;
      return progressService.fetchSignalProgramProgress(resolvedUserId);
    },
    staleTime: 1000 * 30,
  });
}
