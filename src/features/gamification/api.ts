import { apiClient } from '@/lib/api-client';

import type { ClaimResult, DailyCheckInResult, GamificationToday, WeekDay } from './types';

const pad = (n: number) => String(n).padStart(2, '0');
const dateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/**
 * BE /gamification/today chi tra {date, streakCount, studiedToday, claimableTokens, quests}
 * — khong co `week`. Tu dung tuan hien tai (T2 → CN) tu /gamification/study-days.
 */
async function buildWeek(): Promise<WeekDay[]> {
  const today = new Date();
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - ((today.getDay() + 6) % 7));
  const days = Array.from({ length: 7 }, (_, i) => new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i));
  const months = [...new Set(days.map((d) => `${d.getFullYear()}-${d.getMonth() + 1}`))];
  const studied = new Set<string>();
  await Promise.all(
    months.map(async (m) => {
      const [y, mo] = m.split('-').map(Number);
      const list = await gamificationApi.getStudyDays(y, mo).catch(() => [] as string[]);
      (list ?? []).forEach((d) => studied.add(d));
    }),
  );
  const todayKey = dateKey(today);
  return days.map((d, i) => {
    const key = dateKey(d);
    const isToday = key === todayKey;
    return { date: key, weekday: i, isToday, studied: studied.has(key) };
  });
}

export const gamificationApi = {
  getToday: async (): Promise<GamificationToday> => {
    // Goi song song lich tuan voi /today thay vi doi /today xong moi goi (tiet kiem 1 luot cho).
    const [raw, builtWeek] = await Promise.all([
      apiClient<Partial<GamificationToday>>('/gamification/today'),
      buildWeek(),
    ]);
    const week = Array.isArray(raw.week)
      ? raw.week
      : builtWeek.map((d) => (d.isToday && raw.studiedToday ? { ...d, studied: true } : d));
    return {
      date: raw.date ?? dateKey(new Date()),
      streakCount: raw.streakCount ?? 0,
      longestStreak: raw.longestStreak ?? raw.streakCount ?? 0,
      totalStudyDays: raw.totalStudyDays,
      studiedToday: !!raw.studiedToday,
      week,
      quests: raw.quests ?? [],
      claimableTokens: raw.claimableTokens ?? 0,
    };
  },

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
