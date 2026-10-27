import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/store';

import { paymentApi } from '../api';

// Backend chi tra ve toan bo lich su thanh toan cua minh, khong phan trang.
export function useMyOrders() {
  // Khach chua dang nhap: endpoint can token, khong goi.
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['payments', 'me'],
    queryFn: () => paymentApi.getMyHistory(),
    enabled: isAuthenticated,
    staleTime: 1000 * 30,
  });
}
