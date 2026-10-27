import { useMutation } from '@tanstack/react-query';
import { Platform } from 'react-native';

import { getDevicePushTokenSafe } from '@/lib/notifications';

import { notificationsApi } from '../api';

/**
 * Bat/tat push: dang ky hoac go device token tren BE. Tra ve false khi khong lay
 * duoc token (chua cap quyen / ban build chua co native module).
 */
export function useTogglePush() {
  return useMutation({
    mutationFn: async (enabled: boolean) => {
      const token = await getDevicePushTokenSafe();
      if (!token) return false;
      if (enabled) await notificationsApi.registerDeviceToken(token, Platform.OS as 'android' | 'ios');
      else await notificationsApi.removeDeviceToken(token);
      return true;
    },
  });
}
