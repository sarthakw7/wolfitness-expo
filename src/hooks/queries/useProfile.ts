import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/src/hooks/queries/queryKeys";
import { useAuth } from "@/src/hooks/useAuth";
import { profileService } from "@/src/services";

export function useProfile() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useQuery({
    enabled: Boolean(userId),
    queryKey: userId ? queryKeys.profile(userId) : (["profile", "anonymous"] as const),
    queryFn: async () => {
      if (!userId) throw new Error("Not authenticated.");
      return profileService.fetchProfileBundle(userId);
    },
    staleTime: 1000 * 60 * 5,
  });
}

