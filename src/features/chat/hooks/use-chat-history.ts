import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/store';

import { chatApi } from '../api';

export function useChatHistory() {
  // Khach chua dang nhap: endpoint can token, khong goi.
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['chat-history'],
    queryFn: () => chatApi.getHistory(),
    enabled: isAuthenticated,
    select: (groups) =>
      groups
        .flatMap((g) => g.sessions)
        .sort((a, b) => {
          const ta = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
          const tb = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
          return tb - ta;
        }),
  });
}
