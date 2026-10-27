import { Image } from 'expo-image';
import { BookOpenText, User } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { BORDER, CARD, MUTED, ORANGE, TEXT, TEXT2 } from '@/constants/palette';
import { formatShortDate } from '@/features/assignments/meta';
import { localMeta, type MaterialTask } from '@/features/local-contents/hooks';
import type { LocalItem } from '@/features/local-contents/types';

import { GOLD, JADE } from './student-ui';

const NEW_MS = 7 * 24 * 3600 * 1000;

/** The tu lieu thay co soan (giong web class-material-card.tsx), bo cuc ngang hop voi man hinh dien thoai. */
export function MaterialCard({ item, task, onPress }: { item: LocalItem; task?: MaterialTask; onPress: () => void }) {
  const isCharacter = item.type === 'CHARACTER';
  const tint = isCharacter ? GOLD : JADE;
  const pending = task && !task.done;
  const [now] = useState(Date.now);
  const [imageFailed, setImageFailed] = useState(false);
  const isNew = !task && now - new Date(item.createdAt).getTime() < NEW_MS;
  const Icon = isCharacter ? User : BookOpenText;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[s.card, pending && { borderColor: GOLD, borderWidth: 1.5 }]}
    >
      <View style={[s.thumb, { backgroundColor: `${tint}1F` }]}>
        {/* Icon luon nam duoi: anh dang tai hoac loi (vd. link Google Drive can dang nhap) van khong bi o trong. */}
        <Icon size={28} color={tint} strokeWidth={1.8} />
        {item.imageUrl && !imageFailed ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={150}
            onError={() => setImageFailed(true)}
          />
        ) : null}
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        <View style={s.badgeRow}>
          <Text style={[s.kind, { color: tint }]}>{isCharacter ? 'Nhân vật' : 'Bối cảnh'}</Text>
          {pending ? (
            <Text style={[s.badge, { color: GOLD, borderColor: `${GOLD}66` }]}>
              Bài tập · hạn {formatShortDate(task.assignment.deadline)}
            </Text>
          ) : task?.done ? (
            <Text style={[s.badge, { color: JADE, borderColor: `${JADE}66` }]}>Đã làm bài</Text>
          ) : isNew ? (
            <Text style={[s.badge, { color: ORANGE, borderColor: `${ORANGE}55` }]}>Mới</Text>
          ) : null}
        </View>
        <Text style={s.name} numberOfLines={2}>{item.name}</Text>
        <Text style={s.meta} numberOfLines={1}>{localMeta(item)}</Text>
        {item.description ? <Text style={s.desc} numberOfLines={2}>{item.description}</Text> : null}
        <View style={s.footer}>
          {item.createdBy?.fullName ? (
            <Text style={s.author} numberOfLines={1}>Soạn bởi {item.createdBy.fullName}</Text>
          ) : <View style={{ flex: 1 }} />}
          <Text style={s.cta}>{isCharacter ? 'Trò chuyện →' : 'Đọc →'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: 'row', gap: 12,
    backgroundColor: CARD, borderRadius: 12, borderWidth: 1, borderColor: BORDER, padding: 12,
  },
  thumb: {
    width: 76, height: 96, borderRadius: 12, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
  },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  kind: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  badge: { fontSize: 10, fontWeight: '800', borderWidth: 1, borderRadius: 999, paddingHorizontal: 6, paddingVertical: 1 },
  name: { color: TEXT, fontSize: 15, fontWeight: '800', lineHeight: 20 },
  meta: { color: MUTED, fontSize: 12 },
  desc: { color: TEXT2, fontSize: 12, lineHeight: 17 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  author: { flex: 1, color: MUTED, fontSize: 11 },
  cta: { color: ORANGE, fontSize: 12, fontWeight: '800' },
});
