import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/store';

import { assignmentApi } from './api';
import type { StudentAssignmentListParams, SubmitAssignmentPayload } from './types';

export function useStudentAssignments(params: StudentAssignmentListParams = { page: 0, size: 100 }) {
  const enabled = useAuthStore((s) => s.user?.role === 'SCHOOL_STUDENT');
  return useQuery({
    queryKey: ['assignments', 'list', params],
    queryFn: () => assignmentApi.list(params),
    enabled,
  });
}

export function useStudentAssignment(assignmentId: string | undefined) {
  return useQuery({
    queryKey: ['assignments', 'detail', assignmentId],
    queryFn: () => assignmentApi.getById(assignmentId!),
    enabled: !!assignmentId,
    retry: false,
  });
}

export function useStartAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (assignmentId: string) => assignmentApi.start(assignmentId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['assignments'] }),
  });
}

export function useSubmitAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ assignmentId, payload }: { assignmentId: string; payload?: SubmitAssignmentPayload }) =>
      assignmentApi.submit(assignmentId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['assignments'] });
      void queryClient.invalidateQueries({ queryKey: ['student', 'dashboard'] });
    },
  });
}
