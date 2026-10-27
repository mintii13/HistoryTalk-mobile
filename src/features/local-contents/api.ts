import { apiClient } from '@/lib/api-client';

import type { LocalItem, LocalKind } from './types';

interface SpringPage<T> {
  content?: T[];
  totalElements?: number;
}

export interface StudentLocalListParams {
  search?: string;
  classId?: string;
  /** 1-based. */
  page?: number;
  size?: number;
}

function toQuery(params: StudentLocalListParams) {
  const qs = Object.entries({ page: 1, size: 100, ...params })
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&');
  return `?${qs}`;
}

const pathOf = (kind: LocalKind) => (kind === 'CONTEXT' ? 'contexts' : 'characters');

export const localContentApi = {
  list: async (kind: LocalKind, params: StudentLocalListParams = {}): Promise<LocalItem[]> => {
    const page = await apiClient<SpringPage<LocalItem> | LocalItem[] | null>(
      `/student/local-contents/${pathOf(kind)}${toQuery(params)}`,
    );
    const items = Array.isArray(page) ? page : page?.content ?? [];
    return items.map((it) => ({ ...it, type: it.type ?? kind }));
  },

  /** 404 neu chua xuat ban hoac khong thuoc truong cua hoc sinh. */
  getById: async (kind: LocalKind, id: string) => {
    const item = await apiClient<LocalItem>(`/student/local-contents/${pathOf(kind)}/${id}`);
    return { ...item, type: item.type ?? kind };
  },
};
