import { apiClient } from '@/lib/api-client';

import type { ClaimResult, DailyCheckInResult, GamificationToday } from './types';

export const gamificationApi = {
  getToday: () => apiClient<GamificationToday>('/gamification/today'),

  // Ngày đã học (yyyy-MM-dd) trong 1 tháng — cho lịch chuỗi ngày học
  getStudyDays: (year: number, month: number) =>
    apiClient<string[]>(`/gamification/study-days?year=${year}&month=${month}`),

  // Điểm danh hôm nay: tăng streak + thưởng token, backend tự chặn 1 lần/ngày
  dailyCheckIn: () =>
    apiClient<DailyCheckInResult>('/users/me/daily-check-in', { method: 'POST' }),

  claim: (questId: string) =>
    apiClient<ClaimResult>('/gamification/claim', {
      method: 'POST',
      body: JSON.stringify({ questId }),
    }),
};
