import { apiClient } from '@/lib/api-client';

import type { CustomerDashboard, UserDashboard } from './types';

export const dashboardApi = {
  getMyDashboard: () => apiClient<UserDashboard>('/users/me/dashboard'),

  getCustomerDashboard: () => apiClient<CustomerDashboard>('/customer/dashboard'),
};
