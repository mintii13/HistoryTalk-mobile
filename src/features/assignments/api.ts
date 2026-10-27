import { apiClient, apiClientWithMeta } from '@/lib/api-client';

import type {
  AssignmentPage,
  StudentAssignment,
  StudentAssignmentListParams,
  StudentSubmission,
  SubmitAssignmentPayload,
} from './types';

/** BE co the tra score dang chuoi/BigDecimal va `isExpired` thay `expired`. */
function normalize(raw: any): StudentAssignment {
  return {
    ...raw,
    score: raw.score == null || raw.score === '' ? null : Number(raw.score),
    expired: Boolean(raw.expired ?? raw.isExpired),
  };
}

function toQuery(params: StudentAssignmentListParams) {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&');
  return qs ? `?${qs}` : '';
}

export const assignmentApi = {
  list: async (params: StudentAssignmentListParams = {}): Promise<AssignmentPage> => {
    const { data, pagination } = await apiClientWithMeta<any[] | null>(`/student/assignments${toQuery(params)}`);
    const items = (data ?? []).map(normalize);
    return { items, totalElements: pagination?.totalElements ?? items.length };
  },

  getById: async (assignmentId: string) =>
    normalize(await apiClient<any>(`/student/assignments/${assignmentId}`)),

  start: (assignmentId: string) =>
    apiClient<StudentSubmission>(`/student/assignments/${assignmentId}/start`, { method: 'POST' }),

  submit: (assignmentId: string, payload: SubmitAssignmentPayload = {}) =>
    apiClient<StudentSubmission>(`/student/assignments/${assignmentId}/submit`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
