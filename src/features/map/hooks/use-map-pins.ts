import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/store';

import { mapApi } from '../api';
import type { CreateMapPinRequest, MapPin, UpdateMapPinRequest } from '../types';

/**
 * Danh sách ghim chứa cả ghi chú USER của chính người xem, nên cache tách
 * theo tài khoản — ghi chú của người này không bao giờ hiện cho người khác.
 */
const mapPinKey = (contextId: string, year: number, viewer: string) =>
  ['map-pins', contextId, year, viewer] as const;

function useViewerKey() {
  return useAuthStore((s) => s.user?.uid) ?? 'guest';
}

/** Ghim của mọi trận (mỗi trận theo năm của nó) — để vẽ toàn bộ bản đồ. */
export function useOverviewMapPins(contexts: { id: string; year: number }[]) {
  const viewer = useViewerKey();
  return useQueries({
    queries: contexts.map(({ id, year }) => ({
      queryKey: mapPinKey(id, year, viewer),
      queryFn: () => mapApi.getPins(id, year),
      staleTime: 30_000,
    })),
  });
}

export function useMapPins(contextId: string | null, year: number) {
  const viewer = useViewerKey();
  return useQuery({
    queryKey: mapPinKey(contextId ?? '', year, viewer),
    queryFn: () => mapApi.getPins(contextId!, year),
    enabled: !!contextId,
    staleTime: 30_000,
  });
}

function useInvalidatePins(contextId: string | null, year: number) {
  const queryClient = useQueryClient();
  const viewer = useViewerKey();
  return () => {
    if (contextId) void queryClient.invalidateQueries({ queryKey: mapPinKey(contextId, year, viewer) });
  };
}

export function useCreateStudyNote(contextId: string | null, year: number) {
  const invalidate = useInvalidatePins(contextId, year);
  return useMutation({
    mutationFn: (payload: CreateMapPinRequest) => mapApi.createPin(contextId!, payload),
    onSuccess: invalidate,
  });
}

export function useUpdateStudyNote(contextId: string | null, year: number) {
  const invalidate = useInvalidatePins(contextId, year);
  return useMutation({
    mutationFn: ({ pin, changes }: { pin: MapPin; changes: UpdateMapPinRequest }) =>
      mapApi.updatePin(pin.contextId, pin.pinId, changes),
    onSuccess: invalidate,
  });
}

export function useDeleteStudyNote(contextId: string | null, year: number) {
  const invalidate = useInvalidatePins(contextId, year);
  return useMutation({
    mutationFn: (pinId: string) => mapApi.deletePin(contextId!, pinId),
    onSuccess: invalidate,
  });
}
