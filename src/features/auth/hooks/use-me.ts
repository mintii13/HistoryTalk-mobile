import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/store';

import { userApi } from '../user-api';

export function useMe() {
  // Khach chua dang nhap: endpoint can token, khong goi.
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['me'],
    queryFn: () => userApi.getMe(),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5,
  });
}
