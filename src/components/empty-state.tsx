import { StyleSheet, TouchableOpacity, View, type StyleProp, type ViewStyle } from 'react-native';

import { ARCHIVE } from '@/components/archive';
import { Mascot, type MascotMood } from '@/components/mascot/mascot';
import { Text } from '@/components/ui/text';
import { ORANGE, TEXT } from '@/constants/palette';

/** Man trong / loi do mascot dan (giong EmptyState co `mascot` ben web). */
export function EmptyState({
  title,
  description,
  mood = 'idle',
  action,
  style,
}: {
  title: string;
  description?: string;
  mood?: MascotMood;
  action?: { label: string; onPress: () => void };
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[s.root, style]}>
      <Mascot mood={mood} size={72} />
      <Text style={s.title}>{title}</Text>
      {description ? <Text style={s.desc}>{description}</Text> : null}
      {action ? (
        <TouchableOpacity onPress={action.onPress} style={s.btn} activeOpacity={0.85}>
          <Text style={s.btnText}>{action.label}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  root: { alignItems: 'center', paddingTop: 48, paddingHorizontal: 32, gap: 6 },
  title: { marginTop: 8, color: TEXT, fontSize: 15, fontWeight: '700', textAlign: 'center' },
  desc: { color: ARCHIVE.tertiary, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  btn: { marginTop: 10, minHeight: 40, paddingHorizontal: 16, borderRadius: 8, backgroundColor: ORANGE, justifyContent: 'center' },
  btnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
