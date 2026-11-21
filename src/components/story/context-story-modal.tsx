import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { BookOpenText, ChevronRight, CircleHelp, Clapperboard, Clock, GitBranch, Play, Users } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';
import { findBackground, firstBackground, toStoryCharacter } from '@/features/story/story-script';
import type { StoryCharacter, StoryScript } from '@/features/story/types';

import { StoryPlayer } from './story-player';

type CastMember = { id: string; name: string; title?: string | null; imageUrl?: string | null; image?: string | null };

/** Thoi luong, so cho re nhanh, so cau hoi (giong the "Nghe ke chuyen" tren web). */
function storyFacts(script: StoryScript) {
  let chars = 0;
  let choices = 0;
  let quizzes = 0;
  for (const n of script.nodes) {
    const d = n.data;
    if (d.kind === 'line') chars += d.text.length;
    else if (d.kind === 'choice') choices++;
    else if (d.kind === 'quiz') quizzes++;
  }
  // ~15 ky tu/giay khi doc, ~8 giay moi luot chon / tra loi.
  const seconds = Math.round(chars / 15 + (choices + quizzes) * 8);
  return { minutes: seconds < 60 ? 'dưới 1 phút' : `~${Math.round(seconds / 60)} phút`, choices, quizzes };
}

/**
 * Man dau tien cua boi canh (giong web): chon Nghe ke chuyen (kich ban da xuat ban), Xem video gioi thieu,
 * hoac Gap cac nhan vat ngay. Chon ke chuyen thi phat visual novel ngay trong modal nay.
 */
export function ContextStoryModal({
  visible,
  script,
  contextTitle,
  coverImage,
  characters,
  hasVideo = false,
  onVideo,
  onFinish,
  onOpenChat,
  startImmediately = false,
}: {
  visible: boolean;
  /** null: chi co video, man chon khong co the ke chuyen. */
  script: StoryScript | null;
  contextTitle: string;
  /** Anh cua boi canh lam nen man chon; khong co thi dung canh nen cua kich ban. */
  coverImage?: string | null;
  characters: CastMember[];
  hasVideo?: boolean;
  onVideo?: () => void;
  /** Gap cac nhan vat ngay, bo qua, hoac nut chinh o man ket thuc: dong modal, ve trang boi canh. */
  onFinish: () => void;
  onOpenChat: (characterId: string) => void;
  /** Mo thang trinh phat (vd. bam "Nghe ke chuyen" trong trang boi canh). */
  startImmediately?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const [started, setStarted] = useState(startImmediately);
  const cast = useMemo(() => characters.map((c, i) => toStoryCharacter(c, i)), [characters]);
  const narrator = script ? cast.find((c) => c.id === script.narratorId) ?? null : null;
  const bg = findBackground(script ? firstBackground(script) : null);
  const facts = script ? storyFacts(script) : null;

  const finish = () => {
    setStarted(startImmediately);
    onFinish();
  };
  const openChat = (c: StoryCharacter) => onOpenChat(c.id);

  return (
    <Modal visible={visible} animationType="fade" presentationStyle="fullScreen" onRequestClose={finish} statusBarTranslucent>
      {started && script ? (
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
          {coverImage ? (
            <Image source={{ uri: coverImage }} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <LinearGradient colors={bg.colors} locations={bg.locations} style={StyleSheet.absoluteFill} />
          )}
          {narrator?.portraitUrl ? (
            <Image source={{ uri: narrator.portraitUrl }} style={s.narrator} contentFit="contain" contentPosition="bottom" />
          ) : null}
          <LinearGradient
            colors={['rgba(0,0,0,0.45)', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.9)']}
            locations={[0, 0.3, 0.7]}
            style={StyleSheet.absoluteFill}
          />
          <ScrollView
            contentContainerStyle={[s.content, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 28 }]}
            showsVerticalScrollIndicator={false}
          >
            <Text style={s.kicker}>Tìm hiểu bối cảnh</Text>
            <Text style={s.title}>{contextTitle}</Text>

            {script && facts ? (
              <TouchableOpacity activeOpacity={0.85} onPress={() => setStarted(true)} style={s.storyCard} accessibilityRole="button">
                <View style={s.storyIcon}>
                  <BookOpenText size={24} color="#fff" />
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={s.cardTitle}>{narrator ? `Nghe ${narrator.name} kể chuyện` : 'Nghe kể chuyện'}</Text>
                  <View style={s.facts}>
                    <View style={s.fact}>
                      <Clock size={12} color="rgba(255,255,255,0.65)" />
                      <Text style={s.factText}>{facts.minutes}</Text>
                    </View>
                    {facts.choices > 0 ? (
                      <View style={s.fact}>
                        <GitBranch size={12} color="rgba(255,255,255,0.65)" />
                        <Text style={s.factText}>{facts.choices} lựa chọn</Text>
                      </View>
                    ) : null}
                    {facts.quizzes > 0 ? (
                      <View style={s.fact}>
                        <CircleHelp size={12} color="rgba(255,255,255,0.65)" />
                        <Text style={s.factText}>{facts.quizzes} câu hỏi</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
                <Play size={18} color="#D9B25C" fill="#D9B25C" />
              </TouchableOpacity>
            ) : null}

            {hasVideo && onVideo ? (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={onVideo}
                style={script ? s.videoRow : s.storyCard}
                accessibilityRole="button"
              >
                <View style={script ? s.videoIconSmall : s.storyIcon}>
                  <Clapperboard size={script ? 16 : 24} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={script ? s.videoTitle : s.cardTitle}>Xem video giới thiệu</Text>
                  {!script ? <Text style={s.factText}>Video ngắn về bối cảnh</Text> : null}
                </View>
                <Play size={16} color="rgba(255,255,255,0.75)" fill="rgba(255,255,255,0.75)" />
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity onPress={finish} style={s.charactersLink} accessibilityRole="button">
              <Users size={16} color="rgba(255,255,255,0.8)" />
              <Text style={s.charactersText}>Gặp các nhân vật ngay</Text>
              <ChevronRight size={16} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  narrator: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '62%', opacity: 0.55 },
  content: { flexGrow: 1, justifyContent: 'flex-end', paddingHorizontal: 20, gap: 10 },
  kicker: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' },
  title: { color: '#F5F2EA', fontSize: 30, lineHeight: 34, fontWeight: '800', marginBottom: 6 },
  storyCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 8,
    borderWidth: 1, borderColor: 'rgba(217,178,92,0.75)', backgroundColor: 'rgba(20,16,12,0.82)',
  },
  storyIcon: { width: 46, height: 46, borderRadius: 4, backgroundColor: '#B8321F', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { color: '#F5F2EA', fontSize: 16, fontWeight: '800' },
  facts: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 10, rowGap: 2 },
  fact: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  factText: { color: 'rgba(255,255,255,0.65)', fontSize: 12 },
  videoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 11, borderRadius: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)', backgroundColor: 'rgba(0,0,0,0.5)',
  },
  videoIconSmall: {
    width: 34, height: 34, borderRadius: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  videoTitle: { color: '#F5F2EA', fontSize: 14, fontWeight: '700' },
  charactersLink: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, alignSelf: 'flex-start' },
  charactersText: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '700' },
});
