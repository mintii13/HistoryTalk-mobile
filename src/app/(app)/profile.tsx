import { useAuthStore } from '@/features/auth/store';
import GuestProfileScreen from '@/screens/profile/guest-profile-screen';
import ProfileScreen from '@/screens/profile/profile-screen';

// Khach chua dang nhap thay man moi dang nhap thay vi ho so.
export default function ProfileRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <ProfileScreen /> : <GuestProfileScreen />;
}
