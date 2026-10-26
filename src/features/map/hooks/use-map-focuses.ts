import { useQuery } from '@tanstack/react-query';

import { mapApi } from '../api';

/** Điểm camera mặc định của 1 bối cảnh: ưu tiên focus `isDefault`, rồi focus đầu tiên. */
export function useDefaultMapFocus(contextId: string | null) {
  const { data } = useQuery({
    queryKey: ['map-focuses', contextId ?? ''],
    queryFn: () => mapApi.getFocuses(contextId!),
    enabled: !!contextId,
    staleTime: 5 * 60 * 1000,
  });
  const active = (data ?? []).filter((f) => f.isActive).sort((a, b) => a.orderIndex - b.orderIndex);
  return active.find((f) => f.isDefault) ?? active[0] ?? null;
}
