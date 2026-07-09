import type { QueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/src/hooks/queries/queryKeys";

export async function invalidateSignalLifecycleQueries(
  queryClient: QueryClient,
  userId: string,
  signalProgramId?: string | null,
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.signalProgramLifecycle(userId) }),
    queryClient.invalidateQueries({ queryKey: ["signal", "program-progress", userId] }),
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboardOverview(userId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.workout(userId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.workoutActiveSession(userId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.workoutSessionPlans() }),
    queryClient.invalidateQueries({ queryKey: queryKeys.workoutSessionStatuses() }),
    queryClient.invalidateQueries({ queryKey: queryKeys.progressOverview(userId, "7d") }),
    queryClient.invalidateQueries({ queryKey: queryKeys.progressOverview(userId, "30d") }),
    queryClient.invalidateQueries({ queryKey: queryKeys.enrollments(userId) }),
    queryClient.invalidateQueries({ queryKey: ["active-program", userId] }),
    queryClient.invalidateQueries({ queryKey: ["workout", "signal-session"] }),
    queryClient.invalidateQueries({ queryKey: ["workout", "signal-session-plan"] }),
    queryClient.invalidateQueries({ queryKey: ["workout", "signal-session-status"] }),
    ...(signalProgramId
      ? [queryClient.invalidateQueries({ queryKey: ["signal", "programs", "workout", signalProgramId] })]
      : []),
  ]);
}
