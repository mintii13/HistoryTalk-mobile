import { useQueries } from '@tanstack/react-query';

import { characterApi } from '../api';
import type { Character } from '../types';

/** Tai song song nhieu nhan vat (dung chung cache ['characters', id] voi useCharacter). */
export function useCharactersByIds(ids: string[]): Map<string, Character> {
  const queries = useQueries({
    queries: ids.map((id) => ({
      queryKey: ['characters', id],
      queryFn: () => characterApi.getById(id),
      staleTime: 5 * 60 * 1000,
    })),
  });
  return new Map(
    queries
      .map((q) => q.data)
      .filter((c): c is Character => !!c?.id)
      .map((c) => [c.id, c] as const),
  );
}
