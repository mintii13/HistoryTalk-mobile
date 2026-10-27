import { apiClient } from '@/lib/api-client';

import type { Classroom, CreateTokenBoostPayload, StudentDashboard, TokenBoostRequest } from './types';

export const classroomApi = {
  myClassrooms: async () => (await apiClient<Classroom[] | null>('/student/classrooms')) ?? [],

  /** 403/404: hoc sinh khong thuoc lop nay. */
  getById: (classId: string) => apiClient<Classroom>(`/classrooms/${classId}`),

  dashboard: () => apiClient<StudentDashboard>('/student/dashboard'),

  myTokenRequests: async () => (await apiClient<TokenBoostRequest[] | null>('/student/token-requests')) ?? [],

  /** 409: hom nay da co 1 yeu cau dang cho duyet. */
  requestTokens: (payload: CreateTokenBoostPayload) =>
    apiClient<TokenBoostRequest>('/student/token-requests', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
