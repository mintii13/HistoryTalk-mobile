import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BookOpenText, MessageCircle, User } from 'lucide-react-native';
import { ActivityIndicator, Alert, Linking, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState, GOLD, JADE, ListSkeleton, MEN_LAM, Pill, ScreenHeader, studentStyles } from '@/components/student/student-ui';
import { Text } from '@/components/ui/text';
import { BORDER, CARD, MUTED, ORANGE, TEXT, TEXT2 } from '@/constants/palette';
import { characterApi } from '@/features/characters/api';
import { primaryContext } from '@/features/characters/types';
import { useStartChat } from '@/features/chat/hooks/use-start-chat';
import { lifeYears, localYears, useStudentMaterial } from '@/features/local-contents/hooks';
import { LOCAL_CATEGORY_LABELS, LOCAL_ERA_LABELS, type LocalItem } from '@/features/local-contents/types';

function MetaRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View style={s.metaRow}>
      <Text style={s.metaLabel}>{label}</Text>
      <Text style={s.metaValue}>{value}</Text>
    </View>
  );
}

/** Xem 1 tu lieu thay co soan — ban mobile cua web /classes/materials/[kind]/[id]. */
export default function MaterialDetailScreen() {
  const router = useRouter();
  const { kind, id } = useLocalSearchParams<{ kind: string; id: string }>();
  const localKind = kind === 'character' ? 'CHARACTER' : 'CONTEXT';
  const { data: item, isLoading, refetch } = useStudentMaterial(localKind, id);
  const { startChat, startingId } = useStartChat();

  async function chat(it: LocalItem) {
    try {
      const character = await characterApi.getById(it.id);
      const ctx = primaryContext(character) ?? (it.contextIds?.[0] ? { id: it.contextIds[0], name: '' } : null);
      if (!ctx) {
        Alert.alert('Chưa trò chuyện được', 'Nhân vật này chưa gắn với bối cảnh lịch sử nào. Hãy báo thầy cô nhé.');
        return;
      }
      await startChat(character, ctx.id, ctx.name);
    } catch (e: any) {
      Alert.alert('Không mở được cuộc trò chuyện', e?.message ?? 'Vui lòng thử lại.');
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top']}>
        <ScreenHeader title="Kho tư liệu" />
        <ListSkeleton count={2} height={180} />
      </SafeAreaView>
    );
  }

  if (!item) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top']}>
        <ScreenHeader title="Kho tư liệu" />
        <EmptyState
          title="Không xem được tư liệu này"
          description="Tư liệu không tồn tại, chưa được xuất bản hoặc không thuộc trường của bạn."
          action={{ label: 'Thử lại', onPress: () => void refetch() }}
        />
      </SafeAreaView>
    );
  }

  const isCharacter = item.type === 'CHARACTER';
  const tint = isCharacter ? GOLD : JADE;
  const coords = item.latitude != null && item.longitude != null ? `${item.latitude.toFixed(4)}, ${item.longitude.toFixed(4)}` : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top']}>
      <ScreenHeader title={isCharacter ? 'Nhân vật' : 'Bối cảnh'} />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 48 }}>
        <View style={[s.hero, { backgroundColor: `${tint}1A` }]}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
          ) : isCharacter ? (
            <User size={56} color={tint} strokeWidth={1.4} />
          ) : (
            <BookOpenText size={56} color={tint} strokeWidth={1.4} />
          )}
        </View>

        <View style={{ gap: 6 }}>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <Pill label={item.contentScope === 'SCHOOL_WIDE' ? 'Của trường' : 'Của lớp'} color={item.contentScope === 'SCHOOL_WIDE' ? MEN_LAM : JADE} />
          </View>
          <Text style={s.title}>{item.name}</Text>
          {isCharacter && item.title ? <Text style={s.subtitle}>{item.title}</Text> : null}
          {item.createdBy?.fullName ? <Text style={s.author}>Soạn bởi {item.createdBy.fullName}</Text> : null}
        </View>

        <View style={s.card}>
          {isCharacter ? (
            <>
              <MetaRow label="Danh hiệu" value={item.title} />
              <MetaRow label="Năm sinh – mất" value={lifeYears(item)} />
            </>
          ) : (
            <>
              <MetaRow label="Thời kỳ" value={item.era ? LOCAL_ERA_LABELS[item.era] : null} />
              <MetaRow label="Chủ đề" value={item.category ? LOCAL_CATEGORY_LABELS[item.category] : null} />
              <MetaRow label="Năm" value={localYears(item)} />
              <MetaRow label="Địa điểm" value={item.location} />
              <MetaRow label="Tọa độ" value={coords} />
            </>
          )}
        </View>

        {isCharacter ? (
          <View style={s.chatCard}>
            <Text style={s.sectionTitle}>Trò chuyện với {item.name}</Text>
            <Text style={studentStyles.hint}>
              Hỏi nhân vật về cuộc đời và sự kiện lịch sử. AI nhập vai, nên đối chiếu với tư liệu chính thống.
            </Text>
            <TouchableOpacity onPress={() => void chat(item)} disabled={!!startingId} style={studentStyles.primaryBtn} activeOpacity={0.8}>
              {startingId ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <MessageCircle size={18} color="#fff" />
                  <Text style={studentStyles.primaryBtnText}>Bắt đầu trò chuyện</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={s.card}>
          <Text style={s.sectionTitle}>{isCharacter ? 'Tiểu sử' : 'Nội dung'}</Text>
          <Text style={s.body} selectable>{item.description || 'Chưa có nội dung.'}</Text>
        </View>

        {isCharacter && item.personality ? (
          <View style={s.card}>
            <Text style={s.sectionTitle}>Tính cách khi trò chuyện với AI</Text>
            <Text style={s.body}>{item.personality}</Text>
          </View>
        ) : null}

        {!isCharacter && item.videoUrl ? (
          <TouchableOpacity onPress={() => void Linking.openURL(item.videoUrl!)} style={studentStyles.secondaryBtn} activeOpacity={0.8}>
            <Text style={studentStyles.secondaryBtnText}>Xem video giới thiệu</Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity onPress={() => router.push('/classes/materials' as never)} style={s.backLink}>
          <Text style={{ color: ORANGE, fontWeight: '700' }}>← Về Kho tư liệu</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  hero: { height: 200, borderRadius: 12, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  title: { color: TEXT, fontSize: 24, fontWeight: '900', lineHeight: 30 },
  subtitle: { color: TEXT2, fontSize: 15, fontWeight: '600' },
  author: { color: MUTED, fontSize: 12 },
  card: { backgroundColor: CARD, borderRadius: 12, borderWidth: 1, borderColor: BORDER, padding: 16, gap: 8 },
  chatCard: { backgroundColor: CARD, borderRadius: 12, borderWidth: 1.5, borderColor: `${GOLD}66`, padding: 16, gap: 10 },
  sectionTitle: { color: TEXT, fontSize: 15, fontWeight: '800' },
  body: { color: TEXT2, fontSize: 15, lineHeight: 24 },
  metaRow: { flexDirection: 'row', gap: 12 },
  metaLabel: { width: 110, color: MUTED, fontSize: 13, fontWeight: '700' },
  metaValue: { flex: 1, color: TEXT, fontSize: 13, fontWeight: '600' },
  backLink: { alignSelf: 'center', paddingVertical: 10 },
});
