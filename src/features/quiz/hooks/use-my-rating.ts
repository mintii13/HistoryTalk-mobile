import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/store';

import { quizApi } from '../api';

/** Danh gia (1-5 sao) cua chinh nguoi dung cho 1 quiz. */
export function useMyRating(quizId: string) {
  // Khach chua dang nhap: endpoint can token, khong goi.
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['quiz-my-rating', quizId],
    queryFn: () => quizApi.getMyRating(quizId),
    enabled: !!quizId && isAuthenticated,
  });
}
