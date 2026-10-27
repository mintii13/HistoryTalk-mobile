import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/store';
import type { Character } from '@/features/characters/types';

import { chatApi } from '../api';
import { sessionTime } from '../session-time';

/** Moi phien chat voi 1 nhan vat, gom tren tat ca boi canh cua nhan vat, moi nhat truoc. */
export function useCharacterSessions(character: Character | undefined) {
  // Khach chua dang nhap: endpoint can token, khong goi.
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['character-sessions', character?.id],
    queryFn: async () => {
      const contexts = character?.contexts ?? [];
      const results = await Promise.all(
        contexts.map((ctx) => chatApi.getSessions({ characterId: character!.id, contextId: ctx.contextId.id })),
      );
      return results.flat().sort((a, b) => sessionTime(b) - sessionTime(a));
    },
    enabled: !!character?.id && isAuthenticated,
  });
}
