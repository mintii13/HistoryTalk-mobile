import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, SkipForward } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';
import { findBackground, firstBackground, toStoryCharacter } from '@/features/story/story-script';
import type { StoryCharacter, StoryScript } from '@/features/story/types';

import { StoryPlayer } from './story-player';

type CastMember = { id: string; name: string; title?: string | null; imageUrl?: string | null; image?: string | null };

/**
 * Phan mo dau cua boi canh khi co kich ban da xuat ban: trang bia co nut bat dau, roi trinh phat
 * visual novel. Thay cho video gioi thieu (giong web).
 */
export function ContextStoryModal({
  visible,
  script,
  contextTitle,
  characters,
  onFinish,
  onOpenChat,
}: {
  visible: boolean;
  script: StoryScript;
  contextTitle: string;
  characters: CastMember[];
  /** Bo qua, hoac nut chinh o man ket thuc: di tiep toi cac nhan vat. */
  onFinish: () => void;
  onOpenChat: (characterId: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const [started, setStarted] = useState(false);
  const cast = useMemo(() => characters.map((c, i) => toStoryCharacter(c, i)), [characters]);
  const narrator = cast.find((c) => c.id === script.narratorId) ?? null;
  const bg = findBackground(firstBackground(script));

  const finish = () => {
    setStarted(false);
    onFinish();
  };
  const openChat = (c: StoryCharacter) => onOpenChat(c.id);

  return (
    <Modal visible={visible} animationType="fade" presentationStyle="fullScreen" onRequestClose={finish} statusBarTranslucent>
      {started ? (
        <StoryPlayer
          nodes={script.nodes}
          edges={script.edges}
          title={script.title || contextTitle}
          characters={cast}
          onOpenChat={openChat}
          onComplete={finish}
          completeLabel="Gặp các nhân vật"
        />
      ) : (
        <View style={s.root}>
          <LinearGradient colors={bg.colors} locations={bg.locations} style={StyleSheet.absoluteFill} />
          {narrator?.portraitUrl ? (
            <Image
              source={{ uri: narrator.portraitUrl }}
              style={s.narrator}
              contentFit="contain"
              contentPosition="bottom"
            />
          ) : null}
          <LinearGradient
            colors={['rgba(0,0,0,0.35)', 'transparent', 'rgba(0,0,0,0.88)']}
            locations={[0, 0.3, 1]}
            style={StyleSheet.absoluteFill}
          />
          <View style={[s.content, { paddingBottom: insets.bottom + 28 }]}>
            <Text style={s.kicker}>{narrator ? `${narrator.name} kể chuyện` : 'Kể chuyện'}</Text>
            <Text style={s.title}>{script.title || contextTitle}</Text>
            <Text style={s.sub}>
              Nghe kể, chọn hướng câu chuyện và trả lời câu hỏi. Bạn có thể hỏi nhân vật bất cứ lúc nào.
            </Text>
            <View style={s.actions}>
              <TouchableOpacity activeOpacity={0.85} onPress={finish} style={s.skip}>
                <SkipForward size={14} color="rgba(255,255,255,0.9)" />
                <Text style={s.skipText}>Bỏ qua</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.85} onPress={() => setStarted(true)} style={s.start}>
                <Play size={16} color="#fff" fill="#fff" />
                <Text style={s.startText}>Bắt đầu nghe kể</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  narrator: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '70%', opacity: 0.6 },
  content: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 24, gap: 8 },
  kicker: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' },
  title: { color: '#F5F2EA', fontSize: 28, lineHeight: 32, fontWeight: '800' },
  sub: { color: 'rgba(255,255,255,0.72)', fontSize: 13, lineHeight: 19 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  skip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, height: 46, paddingHorizontal: 16, borderRadius: 4,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)', backgroundColor: 'rgba(0,0,0,0.4)',
  },
  skipText: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  start: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 46,
    borderRadius: 4, backgroundColor: '#B8321F',
  },
  startText: { color: '#fff', fontSize: 14, fontWeight: '800' },
});
