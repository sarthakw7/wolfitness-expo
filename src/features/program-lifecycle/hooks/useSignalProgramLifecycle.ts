import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/src/hooks/queries/queryKeys";
import { useAuth } from "@/src/hooks/useAuth";

import { fetchLatestSignalProgramLifecycle } from "../services/signalProgramLifecycle.service";

export function useSignalProgramLifecycle(userId?: string) {
  const { user } = useAuth();
  const resolvedUserId = userId ?? user?.id ?? null;

  return useQuery({
    enabled: Boolean(resolvedUserId),
    queryKey: resolvedUserId ? queryKeys.signalProgramLifecycle(resolvedUserId) : (["signal", "program-lifecycle", "anonymous"] as const),
    queryFn: async () => {
      if (!resolvedUserId) return null;
      return fetchLatestSignalProgramLifecycle(resolvedUserId);
    },
    staleTime: 1000 * 30,
  });
}
