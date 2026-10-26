import AsyncStorage from '@react-native-async-storage/async-storage';
import type { QueryClient } from '@tanstack/react-query';
import { Platform, ToastAndroid } from 'react-native';

import { useAuthStore } from '@/features/auth/store';

import { gamificationApi } from './api';

/**
 * "Chuỗi ngày học" chỉ tăng qua POST /users/me/daily-check-in. Giống web
 * (features/gamification/study-check-in.ts): gọi sau hoạt động học đầu tiên
 * trong ngày (gửi tin nhắn chat, nộp quiz, mở 1 bối cảnh) — không gọi lúc
 * đăng nhập — để streak đếm đúng số ngày thực sự học.
 */

// Giống web: các role backend nhận điểm danh (role trường học chưa bật)
const CHECK_IN_ROLES = new Set(['CUSTOMER', 'CONTENT_ADMIN', 'SYSTEM_ADMIN']);

let inFlight: Promise<void> | null = null;

function localDateKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const storageKey = (uid: string) => `study-check-in:${uid}:${localDateKey()}`;

/** Fire-and-forget: gọi sau mọi hoạt động học cũng được, mỗi ngày chỉ điểm danh 1 lần. */
export function recordStudyActivity(queryClient: QueryClient) {
  const { user, isAuthenticated } = useAuthStore.getState();
  if (!isAuthenticated || !user || !CHECK_IN_ROLES.has(user.role) || inFlight) return;

  const key = storageKey(user.uid);
  inFlight = AsyncStorage.getItem(key)
    .catch(() => null)
    .then(async (done) => {
      if (done === '1') return;
      const result = await gamificationApi.dailyCheckIn();
      try {
        await AsyncStorage.setItem(key, '1');
      } catch {
        // Ghi thất bại: lần sau backend vẫn trả alreadyCheckedInToday
      }
      if (!result.alreadyCheckedInToday && Platform.OS === 'android') {
        const reward = result.rewardTokens > 0
          ? ` · +${result.rewardTokens.toLocaleString('vi-VN')} token`
          : '';
        ToastAndroid.show(`🔥 Chuỗi ${result.streakCount} ngày học${reward}`, ToastAndroid.SHORT);
      }
      void queryClient.invalidateQueries({ queryKey: ['gamification'] });
      void queryClient.invalidateQueries({ queryKey: ['me'] });
    })
    .catch(() => {
      // Không bao giờ chặn hoạt động học chỉ vì điểm danh lỗi
    })
    .finally(() => {
      inFlight = null;
    });
}
