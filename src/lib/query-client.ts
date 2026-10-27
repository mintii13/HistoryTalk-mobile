import { focusManager, QueryClient } from '@tanstack/react-query';
import { AppState, Platform } from 'react-native';

import { ApiError } from '@/lib/api-client';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Du lieu admin vua tao (nhan vat, boi canh, quiz) hien lai sau toi da 1 phut,
      // hoac ngay khi keo de lam moi / mo lai app.
      staleTime: 1000 * 60,
      // Loi 4xx (chua dang nhap, khong co quyen, khong ton tai) goi lai cung vo ich.
      retry: (count, error) => !(error instanceof ApiError && error.status < 500) && count < 2,
    },
  },
});

// Tren dien thoai, React Query khong tu biet app quay lai tu nen: noi AppState vao focusManager
// de cac query da cu tu tai lai khi nguoi dung mo lai app (web da co su kien focus cua trinh duyet).
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (status) => focusManager.setFocused(status === 'active'));
}
