import { apiClient } from '@/lib/api-client';

// Luu y: BE Java hien CHUA co /users/me/device-token (404) — cac ham nay duoc goi
// best-effort, push tu server se chi hoat dong khi BE bo sung endpoint.
export const notificationsApi = {
  registerDeviceToken: (fcmToken: string, platform: 'android' | 'ios') =>
    apiClient<null>('/users/me/device-token', {
      method: 'POST',
      body: JSON.stringify({ fcmToken, platform }),
    }),

  removeDeviceToken: (fcmToken: string) =>
    apiClient<null>('/users/me/device-token', {
      method: 'DELETE',
      body: JSON.stringify({ fcmToken }),
    }),
};
