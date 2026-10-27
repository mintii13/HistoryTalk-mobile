import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/store';

import { gamificationApi } from '../api';

export function useGamificationToday() {
  // Nhiem vu hang ngay chi danh cho khach hang (B2C); tai khoan truong bi BE chan (403), giong web.
  const enabled = useAuthStore((s) => s.user?.role === 'CUSTOMER');
  return useQuery({
    enabled,
    queryKey: ['gamification', 'today'],
    queryFn: () => gamificationApi.getToday(),
    // Tiến độ quest đổi khi user chat/làm quiz — để stale ngắn cho tươi
    staleTime: 1000 * 30,
  });
}
