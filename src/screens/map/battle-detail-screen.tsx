import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, MessageCircle, Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BattleMapCanvas } from '@/components/map/battle-map-canvas';
import { Text } from '@/components/ui/text';
import { BORDER, CARD, MUTED, ORANGE, ORANGE_TINT_MUTED, SURFACE, TEXT, TEXT2 } from '@/constants/palette';
import { useCharactersByContext } from '@/features/characters/hooks/use-characters-by-context';
import { getCharacterImageUri } from '@/features/characters/types';
import { useStartChat } from '@/features/chat/hooks/use-start-chat';
import { useHistoricalContext } from '@/features/historical-contexts/hooks/use-historical-context';
import { emptyBattleMap } from '@/features/map/battle-map';
import { useBattleStory } from '@/features/map/hooks/use-battle-story';
import { battleYear, battleYearLabel } from '@/features/map/hooks/use-map-battles';
import { useMapPins } from '@/features/map/hooks/use-map-pins';

/**
 * Trang "Khám phá trận đánh" — bản mobile của BattleDetailView (người học):
 * lược đồ toàn màn hình, thuyết minh từng giai đoạn kèm phụ đề và giọng đọc,
 * thanh tiến độ theo giai đoạn, và lối vào trò chuyện với nhân vật của trận.
 */
export default function BattleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const contextId = Array.isArray(id) ? id[0] : id ?? '';
  const router = useRouter();
  const [muted, setMuted] = useState(false);

  const { data: event, isLoading, isError, refetch } = useHistoricalContext(contextId);
  const year = event ? battleYear(event) : 0;
  const { data: pins = [] } = useMapPins(event ? contextId : null, year);
  const { data: characters = [] } = useCharactersByContext(contextId);
  const { startChat, startingId } = useStartChat();

  const mainPin = pins.find((p) => p.pinOwnerType === 'ADMIN') ?? null;
  const battleMap = event?.battleMap ?? emptyBattleMap();
  // Lược đồ chưa chia giai đoạn vẫn đọc thuyết minh cũ của ghim
  const story = useBattleStory(battleMap, mainPin?.description ?? '', { voice: !muted });
  const { narration, phases, scenes, scene, sentences, hasStory, sceneWeights, sceneProgress } = story;

  if (isLoading) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={ORANGE} size="large" />
      </View>
    );
  }

  if (isError || !event) {
    return (
      <SafeAreaView style={s.center}>
        <Text style={s.emptyTitle}>Không tải được trận đánh</Text>
        <TouchableOpacity onPress={() => void refetch()} style={s.primaryBtn}>
          <Text style={s.primaryBtnText}>Thử lại</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={s.link}>Quay lại bản đồ</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const yearLabel = battleYearLabel(event);
  const hint = !hasStory
    ? 'Trận đánh này chưa có thuyết minh'
    : phases.length
      ? 'Bấm phát để xem diễn biến từng giai đoạn'
      : 'Bấm phát để nghe thuyết minh';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1f1b18' }} edges={['top', 'bottom']}>
      {/* ── Thanh trên ── */}
      <View style={s.bar}>
        <TouchableOpacity onPress={() => router.back()} style={s.navBtn} accessibilityLabel="Quay lại bản đồ">
          <ArrowLeft size={18} color={TEXT} />
        </TouchableOpacity>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={s.barTitle} numberOfLines={1}>{event.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {yearLabel ? <Text style={s.yearBadge}>{yearLabel}</Text> : null}
            {event.location ? <Text style={s.barMeta} numberOfLines={1}>{event.location}</Text> : null}
          </View>
        </View>
      </View>

      {/* ── Lược đồ ── */}
      <View style={{ flex: 1 }}>
        <BattleMapCanvas
          value={battleMap}
          legendTitle={`${event.name}${yearLabel ? ` – ${yearLabel}` : ''}`}
          symbolView={story.symbolView}
          focus={story.focus}
        />

        {narration.started && phases.length > 0 && scene ? (
          <View style={s.caption} pointerEvents="none">
            <Text style={s.captionEyebrow}>Giai đoạn {narration.scene + 1} / {phases.length}</Text>
            <Text style={s.captionTitle}>{scene.title}</Text>
            {sentences.length > 0 ? (
              <Text style={s.captionText}>
                {sentences.map((text, i) => {
                  const done = i < narration.sentence || narration.finished;
                  const now = i === narration.sentence && !narration.finished;
                  return (
                    <Text key={i} style={done ? s.sentenceDone : now ? s.sentenceNow : s.sentenceNext}>{text} </Text>
                  );
                })}
              </Text>
            ) : null}
          </View>
        ) : null}

        {/* Nhân vật của trận — chạm để trò chuyện */}
        {characters.length > 0 ? (
          <View style={s.characters}>
            {characters.slice(0, 3).map((c) => {
              const uri = getCharacterImageUri(c);
              return (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => { narration.pause(); void startChat(c, event.id, event.name); }}
                  disabled={!!startingId}
                  style={s.charBtn}
                  accessibilityLabel={`Trò chuyện với ${c.name}`}
                >
                  <View style={s.charAvatar}>
                    {uri ? <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" /> : (
                      <Text style={s.charInitial}>{c.name.charAt(0)}</Text>
                    )}
                    {startingId === c.id ? (
                      <View style={s.charBusy}><ActivityIndicator color="#fff" size="small" /></View>
                    ) : null}
                  </View>
                  <View style={s.charBadge}><MessageCircle size={11} color="#fff" /></View>
                  <Text style={s.charName} numberOfLines={1}>{c.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : null}
      </View>

      {/* ── Thanh phát thuyết minh ── */}
      <View style={s.audio}>
        <View style={s.audioHeader}>
          <View style={s.controls}>
            <TouchableOpacity onPress={narration.restart} disabled={!hasStory} style={[s.iconBtn, !hasStory && s.disabled]} accessibilityLabel="Nghe lại từ đầu">
              <RotateCcw size={15} color={TEXT} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={narration.toggle}
              disabled={!hasStory}
              style={[s.playBtn, !hasStory && s.disabled]}
              accessibilityLabel={narration.playing ? 'Dừng' : 'Phát'}
            >
              {narration.playing ? <Pause size={20} color="#fff" fill="#fff" /> : <Play size={20} color="#fff" fill="#fff" />}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setMuted((m) => !m)}
              style={s.iconBtn}
              accessibilityLabel={muted ? 'Bật âm thanh' : 'Tắt âm thanh'}
            >
              {muted ? <VolumeX size={15} color={TEXT} /> : <Volume2 size={15} color={TEXT} />}
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={s.audioTitle}>Diễn biến trận đánh</Text>
            <Text style={s.audioHint} numberOfLines={2}>
              {narration.playing ? 'Đang phát' : muted ? 'Đã tắt tiếng · phụ đề vẫn chạy' : !narration.started ? hint : 'Đã tạm dừng'}
            </Text>
          </View>
        </View>

        {/* 1 đoạn cho mỗi giai đoạn, dài theo thời gian đọc; chạm để nhảy tới */}
        <View style={s.segments}>
          {scenes.map((sc, i) => {
            const current = narration.started && i === narration.scene;
            return (
              <TouchableOpacity
                key={sc.id}
                style={[s.segment, { flexGrow: sceneWeights[i] }]}
                disabled={!hasStory}
                onPress={() => narration.seek(i)}
                accessibilityLabel={scenes.length > 1 ? `Giai đoạn ${i + 1}: ${sc.title}` : 'Từ đầu'}
              >
                <View style={[s.track, current && s.trackCurrent]}>
                  <View style={[s.fill, { width: `${sceneProgress(i) * 100}%` }]} />
                </View>
                {scenes.length > 1 ? <Text style={[s.segmentLabel, current && { color: ORANGE }]} numberOfLines={1}>{sc.title}</Text> : null}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Lược đồ không chia giai đoạn: phụ đề nằm ở thanh phát */}
        {narration.started && phases.length === 0 && sentences[narration.sentence] ? (
          <Text style={s.audioCaption}>{sentences[narration.sentence]}</Text>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24 },
  emptyTitle: { color: TEXT, fontSize: 16, fontWeight: '800' },
  primaryBtn: { backgroundColor: ORANGE, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 10 },
  primaryBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  link: { color: ORANGE, fontSize: 13, fontWeight: '700' },
  disabled: { opacity: 0.4 },

  bar: {
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: CARD, borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  navBtn: {
    width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER,
  },
  barTitle: { color: TEXT, fontSize: 16, fontWeight: '800' },
  yearBadge: {
    color: '#fff', backgroundColor: ORANGE, fontSize: 11, fontWeight: '800',
    paddingHorizontal: 6, paddingVertical: 1, borderRadius: 3, overflow: 'hidden',
  },
  barMeta: { flexShrink: 1, color: MUTED, fontSize: 12 },

  caption: {
    position: 'absolute', left: 12, right: 92, bottom: 12,
    backgroundColor: 'rgba(247,241,234,0.95)', borderRadius: 10, borderWidth: 1, borderColor: BORDER, padding: 12,
  },
  captionEyebrow: { color: ORANGE, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  captionTitle: { color: TEXT, fontSize: 15, fontWeight: '800', marginTop: 2 },
  captionText: { marginTop: 4, fontSize: 13, lineHeight: 19 },
  sentenceDone: { color: TEXT2 },
  sentenceNow: { color: TEXT, fontWeight: '700', backgroundColor: ORANGE_TINT_MUTED },
  sentenceNext: { color: MUTED },

  characters: { position: 'absolute', right: 10, bottom: 12, gap: 10, alignItems: 'center' },
  charBtn: { alignItems: 'center', width: 72 },
  charAvatar: {
    width: 56, height: 56, borderRadius: 28, overflow: 'hidden', borderWidth: 2, borderColor: ORANGE,
    backgroundColor: CARD, alignItems: 'center', justifyContent: 'center',
  },
  charInitial: { color: ORANGE, fontSize: 20, fontWeight: '900' },
  charBusy: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  charBadge: {
    position: 'absolute', top: 38, right: 10, width: 20, height: 20, borderRadius: 10,
    backgroundColor: ORANGE, borderWidth: 2, borderColor: CARD, alignItems: 'center', justifyContent: 'center',
  },
  charName: {
    marginTop: 4, color: '#fff', fontSize: 11, fontWeight: '800', textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)', textShadowRadius: 4,
  },

  audio: { backgroundColor: CARD, borderTopWidth: 1, borderTopColor: BORDER, paddingHorizontal: 14, paddingVertical: 10, gap: 10 },
  audioHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: {
    width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: BORDER, backgroundColor: SURFACE,
  },
  playBtn: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: ORANGE },
  audioTitle: { color: TEXT, fontSize: 14, fontWeight: '800' },
  audioHint: { color: MUTED, fontSize: 11, marginTop: 1 },
  segments: { flexDirection: 'row', gap: 4 },
  segment: { flexBasis: 0, minWidth: 0, gap: 3 },
  track: { height: 6, borderRadius: 3, backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, overflow: 'hidden' },
  trackCurrent: { borderColor: ORANGE },
  fill: { height: '100%', backgroundColor: ORANGE },
  segmentLabel: { color: MUTED, fontSize: 9, fontWeight: '700' },
  audioCaption: { color: TEXT, fontSize: 13, lineHeight: 19 },
});
