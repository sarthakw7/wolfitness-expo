import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/src/hooks/queries/queryKeys";
import { programsService } from "@/src/services";

export function usePrograms(filters: { creatorId?: string; publishedOnly?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.programs(filters),
    queryFn: () => programsService.fetchPrograms(filters),
    staleTime: 1000 * 60 * 10,
  });
}

