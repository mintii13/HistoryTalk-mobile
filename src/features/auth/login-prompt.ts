import { useCallback } from 'react';
import { create } from 'zustand';

import { useAuthStore } from './store';

export interface LoginPromptCopy {
  title: string;
  message: string;
}

// Cung noi dung voi useAuthRequiredNavigation ben web.
export const LOGIN_PROMPTS = {
  chat: {
    title: 'Bạn cần đăng nhập để chat',
    message: 'Đăng nhập để bắt đầu trò chuyện với các nhân vật lịch sử và lưu lại lịch sử hội thoại của bạn.',
  },
  quiz: {
    title: 'Bạn cần đăng nhập để làm quiz',
    message: 'Bạn vẫn có thể xem nội dung quiz. Đăng nhập để bắt đầu làm bài, nộp kết quả và lưu lại lịch sử luyện tập.',
  },
  generic: {
    title: 'Bạn cần đăng nhập',
    message: 'Đăng nhập để dùng tính năng này và lưu lại tiến trình học của bạn.',
  },
} satisfies Record<string, LoginPromptCopy>;

interface LoginPromptState {
  prompt: LoginPromptCopy | null;
  show: (prompt: LoginPromptCopy) => void;
  close: () => void;
}

export const useLoginPromptStore = create<LoginPromptState>((set) => ({
  prompt: null,
  show: (prompt) => set({ prompt }),
  close: () => set({ prompt: null }),
}));

/**
 * Khach duoc xem noi dung cong khai; hanh dong can tai khoan (chat, lam quiz...) di qua day:
 * da dang nhap thi chay ngay, chua thi hien modal moi dang nhap (LoginRequiredModal o root).
 */
export function useRequireAuth() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const show = useLoginPromptStore((s) => s.show);
  return useCallback(
    (action: () => void, prompt: LoginPromptCopy = LOGIN_PROMPTS.generic) => {
      if (isAuthenticated) action();
      else show(prompt);
    },
    [isAuthenticated, show],
  );
}
