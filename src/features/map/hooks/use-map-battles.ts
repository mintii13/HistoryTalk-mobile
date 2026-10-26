import { useQuery } from '@tanstack/react-query';

import { historicalContextApi } from '@/features/historical-contexts/api';
import type { HistoricalContext } from '@/features/historical-contexts/types';

/** Mọi bối cảnh (tối đa 200, giống web) — bản đồ chỉ vẽ những trận đã có ghim ADMIN. */
export function useMapBattles() {
  return useQuery({
    queryKey: ['historical-contexts', 'map'],
    queryFn: async () => (await historicalContextApi.getAll({ page: 1, limit: 200 })).content.filter((c) => !!c.id),
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Năm dùng để đọc/ghi ghim của trận — phải khớp web (event.year = raw.year ?? 0),
 * vì ghim do admin đặt trên web lưu theo đúng năm này.
 */
export function battleYear(ctx: Pick<HistoricalContext, 'year'>) {
  return ctx.year ?? 0;
}

export function battleYearLabel(ctx: Pick<HistoricalContext, 'year' | 'isBC'>) {
  if (ctx.year == null) return '';
  return ctx.isBC || ctx.year < 0 ? `${Math.abs(ctx.year)} TCN` : String(ctx.year);
}
