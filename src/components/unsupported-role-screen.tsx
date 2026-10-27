import { MonitorSmartphone } from 'lucide-react-native';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';
import { BG, CARD, BORDER, ORANGE, TEXT, TEXT2 } from '@/constants/palette';
import { unsupportedRoleMessage } from '@/features/auth/roles';
import { useAuthStore } from '@/features/auth/store';

/** Hien khi phien dang nhap thuoc role khong dung app mobile (giao vien, quan tri...). */
export function UnsupportedRoleScreen({ role }: { role?: string | null }) {
  const logout = useAuthStore((s) => s.logout);
  return (
    <SafeAreaView style={s.root}>
      <View style={s.card}>
        <MonitorSmartphone size={40} color={ORANGE} />
        <Text style={s.title}>Vui lòng dùng website</Text>
        <Text style={s.desc}>{unsupportedRoleMessage(role)}</Text>
        <TouchableOpacity onPress={() => void logout()} style={s.btn} activeOpacity={0.8}>
          <Text style={s.btnText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: {
    width: '100%', maxWidth: 420, alignItems: 'center', gap: 12,
    backgroundColor: CARD, borderRadius: 12, borderWidth: 1, borderColor: BORDER, padding: 24,
  },
  title: { color: TEXT, fontSize: 18, fontWeight: '800', textAlign: 'center' },
  desc: { color: TEXT2, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  btn: { marginTop: 8, backgroundColor: ORANGE, borderRadius: 12, paddingHorizontal: 22, paddingVertical: 12 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
