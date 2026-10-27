import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/store';

import { dashboardApi } from '../api';

export function useMyDashboard() {
  // Khach chua dang nhap: endpoint can token, khong goi.
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['dashboard', 'me'],
    queryFn: () => dashboardApi.getMyDashboard(),
    enabled: isAuthenticated,
    staleTime: 1000 * 60,
  });
}
