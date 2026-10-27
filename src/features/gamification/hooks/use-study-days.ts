import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/store';

import { gamificationApi } from '../api';

export function useStudyDays(year: number, month: number, enabled = true) {
  // Khach chua dang nhap: endpoint can token, khong goi.
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['gamification', 'study-days', year, month],
    queryFn: () => gamificationApi.getStudyDays(year, month),
    enabled: enabled && isAuthenticated,
    staleTime: 1000 * 60,
  });
}
