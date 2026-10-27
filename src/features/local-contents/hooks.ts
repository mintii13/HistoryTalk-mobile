import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useStudentAssignments } from '@/features/assignments/hooks';
import { isDone } from '@/features/assignments/meta';
import type { StudentAssignment } from '@/features/assignments/types';
import { useAuthStore } from '@/features/auth/store';

import { localContentApi } from './api';
import { LOCAL_ERA_LABELS, type LocalItem, type LocalKind } from './types';

/** Tat ca tu lieu da xuat ban hoc sinh xem duoc (boi canh + nhan vat). */
export function useStudentMaterials() {
  const enabled = useAuthStore((s) => s.user?.role === 'SCHOOL_STUDENT');
  return useQuery({
    queryKey: ['student', 'local-contents'],
    queryFn: async () => {
      const [contexts, characters] = await Promise.all([
        localContentApi.list('CONTEXT'),
        localContentApi.list('CHARACTER'),
      ]);
      return [...contexts, ...characters].filter((it) => it.isPublished !== false);
    },
    enabled,
    staleTime: 1000 * 60 * 2,
  });
}

export function useStudentMaterial(kind: LocalKind | undefined, id: string | undefined) {
  return useQuery({
    queryKey: ['student', 'local-content', kind, id],
    queryFn: () => localContentApi.getById(kind!, id!),
    enabled: !!kind && !!id,
    retry: false,
  });
}

/** Tu lieu cua 1 lop: cua ca truong, hoac duoc giao cho lop do. */
export const isForClass = (item: LocalItem, classId: string) =>
  item.contentScope === 'SCHOOL_WIDE' || (item.classIds ?? []).includes(classId);

export function localYears(item: Pick<LocalItem, 'year' | 'startYear' | 'endYear' | 'isBC'>) {
  const fmt = (y: number) => (item.isBC ? `${y} TCN` : String(y));
  if (item.startYear != null && item.endYear != null && item.startYear !== item.endYear) {
    return `${fmt(item.startYear)} – ${fmt(item.endYear)}`;
  }
  const y = item.year ?? item.startYear ?? item.endYear;
  return y == null ? null : fmt(y);
}

export function lifeYears(item: Pick<LocalItem, 'bornYear' | 'isBornBc' | 'deathYear' | 'isDeathBc'>) {
  if (item.bornYear == null && item.deathYear == null) return null;
  const fmt = (y: number | null | undefined, bc: boolean | null | undefined) => (y == null ? '?' : bc ? `${y} TCN` : String(y));
  return `${fmt(item.bornYear, item.isBornBc)} – ${fmt(item.deathYear, item.isDeathBc)}`;
}

/** 1 dong tom tat duoi tieu de: "Cổ đại · 40 – 43 · Mê Linh" hoac danh hieu nhan vat. */
export function localMeta(item: LocalItem) {
  if (item.type === 'CHARACTER') return item.title || 'Nhân vật';
  return [item.era ? LOCAL_ERA_LABELS[item.era] : null, localYears(item), item.location].filter(Boolean).join(' · ') || 'Bối cảnh';
}

/** Duong dan man chi tiet tu lieu. */
export const materialHref = (item: Pick<LocalItem, 'type' | 'id'>) =>
  `/classes/materials/${item.type === 'CHARACTER' ? 'character' : 'context'}/${item.id}`;

export interface MaterialTask {
  assignment: StudentAssignment;
  done: boolean;
}

/** targetId → bai tap doc/chat gan voi tu lieu; bai chua lam uu tien hon bai da lam (giong web). */
export function useMaterialTasks(): Map<string, MaterialTask> {
  const { data } = useStudentAssignments({ page: 0, size: 100 });
  return useMemo(() => {
    const map = new Map<string, MaterialTask>();
    for (const a of data?.items ?? []) {
      if (a.assignmentType === 'QUIZ_TEST' || a.submissionStatus === 'EXEMPTED') continue;
      const done = isDone(a.submissionStatus);
      const prev = map.get(a.targetId);
      if (!prev || (prev.done && !done)) map.set(a.targetId, { assignment: a, done });
    }
    return map;
  }, [data]);
}
