import { useMutation, useQueryClient } from '@tanstack/react-query';

import { chatApi } from '../api';

/** Xoa mem 1 phien chat, lam moi lich su chat va danh sach phien theo nhan vat. */
export function useDeleteSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => chatApi.deleteSession(sessionId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['character-sessions'] }),
        queryClient.invalidateQueries({ queryKey: ['chat-history'] }),
      ]);
    },
  });
}
