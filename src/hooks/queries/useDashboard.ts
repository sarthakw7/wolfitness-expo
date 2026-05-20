import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/src/hooks/queries/queryKeys";
import { useAuth } from "@/src/hooks/useAuth";
import { dashboardService } from "@/src/services";

function toIsoDate(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function useDashboard() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const todayIso = toIsoDate(new Date());

  return useQuery({
    enabled: Boolean(userId),
    queryKey: userId ? queryKeys.dashboardOverview(userId) : (["dashboard", "overview", "anonymous"] as const),
    queryFn: async () => {
      if (!userId) throw new Error("Not authenticated.");
      return dashboardService.fetchDashboardOverview(userId, todayIso);
    },
    staleTime: 1000 * 30,
  });
}

