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

function weekRange(date: Date) {
  const local = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = local.getDay(); // 0: Sun ... 6: Sat
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(local);
  monday.setDate(local.getDate() + mondayOffset);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { weekEndIso: toIsoDate(sunday), weekStartIso: toIsoDate(monday) };
}

export function useDashboard() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const todayIso = toIsoDate(new Date());
  const { weekEndIso, weekStartIso } = weekRange(new Date());

  return useQuery({
    enabled: Boolean(userId),
    queryKey: userId ? queryKeys.dashboardOverview(userId) : (["dashboard", "overview", "anonymous"] as const),
    queryFn: async () => {
      if (!userId) throw new Error("Not authenticated.");
      return dashboardService.fetchDashboardOverview(userId, todayIso, weekStartIso, weekEndIso);
    },
    staleTime: 1000 * 30,
  });
}
