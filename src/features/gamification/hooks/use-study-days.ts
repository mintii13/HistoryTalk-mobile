import { useQuery } from '@tanstack/react-query';

import { gamificationApi } from '../api';

export function useStudyDays(year: number, month: number, enabled = true) {
  return useQuery({
    queryKey: ['gamification', 'study-days', year, month],
    queryFn: () => gamificationApi.getStudyDays(year, month),
    enabled,
    staleTime: 1000 * 60,
  });
}
