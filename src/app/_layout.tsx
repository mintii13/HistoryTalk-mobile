import '../global.css';

import { useFonts } from 'expo-font';
import { Slot } from 'expo-router';
import { View } from 'react-native';

import { LoginRequiredModal } from '@/components/login-required-modal';
import { Mascot } from '@/components/mascot/mascot';
import { PlatformLockModal } from '@/components/platform-lock-modal';
import { SessionExpiredModal } from '@/components/session-expired-modal';
import { BG } from '@/constants/palette';
import { FontAssets } from '@/constants/theme';
import { AppProviders } from '@/providers/app-providers';
import { useProtectedRoute } from '@/providers/use-protected-route';

export default function RootLayout() {
  // Cho font (Inter/Plus Jakarta/Big Shoulders) de chu khong nhay tu font he thong sang; loi tai font thi van vao app.
  const [fontsLoaded, fontError] = useFonts(FontAssets);
  const { isLoading } = useProtectedRoute();

  // Chờ load session từ SecureStore (mascot "đang nghĩ" giống trang loading bên web)
  if (isLoading || (!fontsLoaded && !fontError)) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: BG }}>
        <Mascot mood="thinking" size={72} arms={false} label="Đang tải" />
      </View>
    );
  }

  // Luôn render <Slot/> sau khi load xong: việc chặn/chuyển hướng theo auth
  // nằm ở layout của từng nhóm ((app)/(auth)) bằng <Redirect>. Nếu return
  // null ở đây thì navigator không bao giờ mount và app kẹt màn hình đen.
  return (
    <AppProviders>
      <Slot />
      <SessionExpiredModal />
      <PlatformLockModal />
      <LoginRequiredModal />
    </AppProviders>
  );
}
