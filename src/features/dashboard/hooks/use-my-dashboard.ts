import { useQuery } from '@tanstack/react-query';

import { dashboardApi } from '../api';

export function useMyDashboard() {
  return useQuery({
    queryKey: ['dashboard', 'me'],
    queryFn: () => dashboardApi.getMyDashboard(),
    staleTime: 1000 * 60,
  });
}
