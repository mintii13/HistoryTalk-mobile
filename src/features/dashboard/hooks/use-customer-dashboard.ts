import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/store';

import { dashboardApi } from '../api';

export function useCustomerDashboard() {
  const isCustomer = useAuthStore((s) => s.user?.role === 'CUSTOMER');
  return useQuery({
    queryKey: ['dashboard', 'customer'],
    queryFn: () => dashboardApi.getCustomerDashboard(),
    // Endpoint chỉ mở cho CUSTOMER — role khác gọi sẽ bị 403
    enabled: isCustomer,
    staleTime: 1000 * 60,
  });
}
