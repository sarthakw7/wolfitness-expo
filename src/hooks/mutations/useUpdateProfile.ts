import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/src/hooks/queries/queryKeys";
import { useAuth } from "@/src/hooks/useAuth";
import { profileService, type profileService as ProfileNamespace } from "@/src/services";

type UpdateProfileInput = ProfileNamespace.UpdateProfileInput;

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useMutation({
    mutationFn: async (input: UpdateProfileInput) => {
      if (!userId) throw new Error("Not authenticated.");
      await profileService.updateProfile(userId, input);
    },
    onSuccess: async () => {
      if (!userId) return;
      await queryClient.invalidateQueries({ queryKey: queryKeys.profile(userId) });
    },
  });
}

