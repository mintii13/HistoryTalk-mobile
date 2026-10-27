import { useQuery } from '@tanstack/react-query';

import { quizApi } from '../api';

/** Chi tiet 1 lan lam quiz (cau hoi kem dap an da nop va dung/sai). */
export function useQuizResultDetail(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['quiz-result-detail', sessionId],
    queryFn: () => quizApi.getMyResultBySession(sessionId!),
    enabled: !!sessionId,
  });
}
