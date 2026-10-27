import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/store';

import { classroomApi } from './api';
import type { CreateTokenBoostPayload, StudentDashboard } from './types';

const useIsStudent = () => useAuthStore((s) => s.user?.role === 'SCHOOL_STUDENT');

export function useMyClassrooms() {
  const enabled = useIsStudent();
  return useQuery({
    queryKey: ['student', 'classrooms'],
    queryFn: classroomApi.myClassrooms,
    enabled,
    staleTime: 1000 * 60 * 5,
  });
}

export function useClassroom(classId: string | undefined) {
  return useQuery({
    queryKey: ['student', 'classroom', classId],
    queryFn: () => classroomApi.getById(classId!),
    enabled: !!classId,
    retry: false,
  });
}

export function useStudentDashboard() {
  const enabled = useIsStudent();
  return useQuery({
    queryKey: ['student', 'dashboard'],
    queryFn: classroomApi.dashboard,
    enabled,
    staleTime: 1000 * 30,
  });
}

export function useMyTokenRequests() {
  const enabled = useIsStudent();
  return useQuery({
    queryKey: ['student', 'token-requests'],
    queryFn: classroomApi.myTokenRequests,
    enabled,
  });
}

export function useRequestTokens() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTokenBoostPayload) => classroomApi.requestTokens(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['student', 'token-requests'] });
    },
  });
}

export interface TodayQuota {
  used: number;
  remaining: number;
  bonus: number;
  quota: number;
}

/** Han muc token hom nay cua hoc sinh (giong web useTodayQuota). */
export function todayQuota(d: StudentDashboard | undefined): TodayQuota | null {
  if (!d) return null;
  const used = Math.max(d.tokensUsedToday ?? 0, 0);
  const remaining = Math.max(d.currentTokens ?? 0, 0);
  const bonus = Math.max(d.dailyBonusTokens ?? 0, 0);
  const baseQuota = d.dailyTokenLimit != null ? Math.max(d.dailyTokenLimit, 0) : used + remaining - bonus;
  return { used, remaining, bonus, quota: baseQuota + bonus };
}

/** yyyy-MM-dd theo gio thiet bi — so voi requestDate cua yeu cau xin token. */
export function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
