import * as Speech from 'expo-speech';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Check, ChevronDown, FastForward, History, MessageCircle, RotateCcw, SkipForward, Trophy, Unplug, Volume2, VolumeX, X,
} from 'lucide-react-native';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';
import { findBackground } from '@/features/story/story-script';
import type { StoryCharacter, StoryEdge, StoryNode } from '@/features/story/types';
import { useStoryEngine } from '@/features/story/use-story-engine';

const CHAR_MS = 26;
const GOLD = '#D9B25C';
const CREAM = '#F5F2EA';
const PANEL = 'rgba(14,12,11,0.88)';

function useTypewriter(text: string, key: string) {
  const [count, setCount] = useState(0);
  const [prevKey, setPrevKey] = useState(key);
  if (prevKey !== key) {
    setPrevKey(key);
    setCount(0);
  }
  useEffect(() => {
    if (count >= text.length) return;
    const t = setTimeout(() => setCount((c) => Math.min(text.length, c + 1)), CHAR_MS);
    return () => clearTimeout(t);
  }, [count, text]);
  return { shown: text.slice(0, count), done: count >= text.length, complete: () => setCount(text.length) };
}

/** Doc loi thoai bang giong tieng Viet cua may (expo-speech). */
function useSpeech(enabled: boolean, text: string | null, key: string, onEnd: () => void) {
  const onEndRef = useRef(onEnd);
  useEffect(() => {
    onEndRef.current = onEnd;
  });
  useEffect(() => {
    if (!enabled || !text) return;
    Speech.stop();
    Speech.speak(text, { language: 'vi-VN', rate: 1.05, onDone: () => onEndRef.current() });
    return () => {
      Speech.stop();
    };
  }, [enabled, text, key]);
}

function ControlButton({
  label, active, highlight, onPress, children,
}: { label: string; active?: boolean; highlight?: boolean; onPress: () => void; children: ReactNode }) {
  return (
    <TouchableOpacity
      accessibilityLabel={label}
      accessibilityState={{ selected: !!active }}
      onPress={onPress}
      activeOpacity={0.8}
      hitSlop={4}
      style={[s.control, active && s.controlActive, highlight && s.controlHighlight]}
    >
      {children}
    </TouchableOpacity>
  );
}

function initials(name: string) {
  return name.split(' ').slice(-2).map((w) => w[0]?.toUpperCase()).join('');
}

function Portrait({ character }: { character: StoryCharacter | null }) {
  if (!character) return null;
  return (
    <View pointerEvents="none" style={s.portraitWrap}>
      {character.portraitUrl ? (
        <Image source={{ uri: character.portraitUrl }} style={s.portrait} contentFit="contain" contentPosition="bottom" />
      ) : (
        <View style={[s.silhouette, { backgroundColor: character.accent + 'CC' }]}>
          <Text style={{ color: CREAM, fontSize: 34, fontWeight: '800' }}>{initials(character.name)}</Text>
        </View>
      )}
    </View>
  );
}

/** Trinh phat visual novel cho nguoi hoc — port StoryPlayer cua web. */
export function StoryPlayer({
  nodes,
  edges,
  title,
  characters,
  onOpenChat,
  onComplete,
  completeLabel = 'Tiếp tục',
}: {
  nodes: StoryNode[];
  edges: StoryEdge[];
  title: string;
  characters: StoryCharacter[];
  /** Mo chat voi nhan vat dang noi; dong chat la quay lai dung doan dang xem. */
  onOpenChat?: (character: StoryCharacter) => void;
  /** Bo qua, hoac nut chinh o man ket thuc. */
  onComplete: () => void;
  completeLabel?: string;
}) {
  const insets = useSafeAreaInsets();
  const engine = useStoryEngine(nodes, edges, characters);
  const { node, speaker, speakerName } = engine;
  const d = node?.data ?? null;

  const [auto, setAuto] = useState(false);
  const [voice, setVoice] = useState(false);
  const [logOpen, setLogOpen] = useState(false);

  // Nhan vat de hoi: nguoi noi gan nhat (man ket thuc khong co nguoi noi).
  const [chatCharacter, setChatCharacter] = useState<StoryCharacter | null>(speaker);
  if (speaker && speaker.id !== chatCharacter?.id) setChatCharacter(speaker);

  const lineText = d?.kind === 'line' ? d.text : d?.kind === 'choice' ? d.prompt : d?.kind === 'quiz' ? d.question : '';
  const stepKey = `${node?.id}-${engine.steps}`;
  const typer = useTypewriter(lineText, stepKey);
  const [spoken, setSpoken] = useState<string | null>(null);
  useSpeech(voice && !logOpen, lineText || null, stepKey, () => setSpoken(stepKey));

  // Tu dong: hien (va doc, neu bat giong) het cau thi sang cau tiep.
  const speechDone = !voice || spoken === stepKey;
  useEffect(() => {
    if (!auto || d?.kind !== 'line' || !typer.done || !speechDone || logOpen) return;
    const t = setTimeout(engine.advance, voice ? 500 : 900 + lineText.length * 18);
    return () => clearTimeout(t);
  }, [auto, d?.kind, typer.done, speechDone, logOpen, voice, lineText.length, engine.advance]);

  useEffect(() => () => {
    Speech.stop();
  }, []);

  const openChat = () => {
    if (!chatCharacter || !onOpenChat) return;
    setAuto(false);
    Speech.stop();
    onOpenChat(chatCharacter);
  };

  const proceed = () => {
    if (d?.kind !== 'line') {
      if (!typer.done) typer.complete();
      return;
    }
    if (!typer.done) typer.complete();
    else engine.advance();
  };

  const bg = findBackground(engine.background);
  const showDialogue = !!d && d.kind !== 'end' && !engine.isDeadEnd;

  return (
    <View style={s.root}>
      <Pressable style={StyleSheet.absoluteFill} onPress={proceed} accessibilityLabel="Tiếp tục">
        <LinearGradient colors={bg.colors} locations={bg.locations} style={StyleSheet.absoluteFill} />
        <LinearGradient
          colors={['rgba(0,0,0,0.35)', 'transparent', 'rgba(0,0,0,0.75)']}
          locations={[0, 0.3, 1]}
          style={StyleSheet.absoluteFill}
        />
        <Portrait character={speaker} />
      </Pressable>

      {/* Thanh tren */}
      <View style={[s.topBar, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
        <View style={s.titleBox}>
          <Text style={s.kicker}>Kể chuyện</Text>
          <Text style={s.title} numberOfLines={1}>{title}</Text>
        </View>
        <View style={s.controls}>
          {chatCharacter && onOpenChat ? (
            <ControlButton label={`Hỏi ${chatCharacter.name}`} highlight onPress={openChat}>
              <MessageCircle size={16} color="#111" />
            </ControlButton>
          ) : null}
          <ControlButton label="Tự động chạy" active={auto} onPress={() => setAuto((v) => !v)}>
            <FastForward size={16} color={auto ? '#111' : CREAM} />
          </ControlButton>
          <ControlButton label="Đọc lời thoại" active={voice} onPress={() => setVoice((v) => !v)}>
            {voice ? <Volume2 size={16} color="#111" /> : <VolumeX size={16} color={CREAM} />}
          </ControlButton>
          <ControlButton label="Nhật ký lời thoại" active={logOpen} onPress={() => setLogOpen((v) => !v)}>
            <History size={16} color={logOpen ? '#111' : CREAM} />
          </ControlButton>
          <ControlButton label="Xem lại từ đầu" onPress={engine.restart}>
            <RotateCcw size={16} color={CREAM} />
          </ControlButton>
          <ControlButton label="Bỏ qua phần kể chuyện" onPress={onComplete}>
            <SkipForward size={16} color={CREAM} />
          </ControlButton>
        </View>
      </View>

      {/* Lua chon */}
      {d?.kind === 'choice' && typer.done ? (
        <View style={s.overlayCenter}>
          <View style={s.optionList}>
            {d.options.map((o, i) => (
              <TouchableOpacity key={o.id} activeOpacity={0.85} onPress={() => engine.choose(o.id)} style={s.choice}>
                <View style={s.optionBadge}><Text style={s.optionBadgeText}>{i + 1}</Text></View>
                <Text style={s.optionText}>{o.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : null}

      {/* Cau hoi */}
      {d?.kind === 'quiz' && typer.done ? (
        <View style={s.overlayCenter}>
          <ScrollView style={{ width: '100%', maxHeight: '70%' }} contentContainerStyle={s.optionList}>
            {d.answers.map((a, i) => {
              const reveal = !!engine.quiz;
              const picked = engine.quiz?.pickedId === a.id;
              const isCorrect = a.id === d.correctId;
              return (
                <TouchableOpacity
                  key={a.id}
                  disabled={reveal}
                  activeOpacity={0.85}
                  onPress={() => engine.answerQuiz(a.id)}
                  style={[
                    s.answer,
                    reveal && isCorrect && s.answerCorrect,
                    reveal && picked && !isCorrect && s.answerWrong,
                    reveal && !picked && !isCorrect && { opacity: 0.5 },
                  ]}
                >
                  <View style={s.optionBadge}>
                    {reveal && isCorrect ? (
                      <Check size={13} color={CREAM} strokeWidth={3} />
                    ) : reveal && picked ? (
                      <X size={13} color={CREAM} strokeWidth={3} />
                    ) : (
                      <Text style={s.optionBadgeText}>{String.fromCharCode(65 + i)}</Text>
                    )}
                  </View>
                  <Text style={s.optionText}>{a.label}</Text>
                </TouchableOpacity>
              );
            })}
            {engine.quiz ? (
              <View style={s.explain}>
                <Text style={[s.explainTitle, { color: engine.quiz.correct ? '#7FB0A6' : '#F08C74' }]}>
                  {engine.quiz.correct ? 'Chính xác!' : 'Chưa đúng'}
                </Text>
                {d.explanation ? <Text style={s.explainText}>{d.explanation}</Text> : null}
                <TouchableOpacity activeOpacity={0.85} onPress={engine.continueAfterQuiz} style={s.primaryBtn}>
                  <Text style={s.primaryBtnText}>Tiếp tục</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </ScrollView>
        </View>
      ) : null}

      {/* Hop thoai */}
      {showDialogue && !(d?.kind === 'quiz' && engine.quiz) ? (
        <Pressable onPress={proceed} style={[s.dialogue, { bottom: insets.bottom + 14 }]}>
          <View style={[s.namePlate, { backgroundColor: speaker?.accent ?? '#2E2C29' }]}>
            <Text style={s.nameText}>{speakerName}</Text>
          </View>
          <Text style={[s.lineText, !speaker && s.narration]}>{typer.shown}</Text>
          {d?.kind === 'line' && typer.done ? (
            <View style={s.nextHint}><ChevronDown size={18} color={GOLD} /></View>
          ) : null}
        </Pressable>
      ) : null}

      {/* Ket thuc */}
      {d?.kind === 'end' ? (
        <View style={[s.overlayCenter, { backgroundColor: 'rgba(0,0,0,0.55)' }]}>
          <View style={s.endCard}>
            <View style={s.trophy}><Trophy size={26} color="#111" /></View>
            <Text style={s.kicker}>Hoàn thành câu chuyện</Text>
            <Text style={s.endTitle}>{d.title}</Text>
            {d.summary ? <Text style={s.endSummary}>{d.summary}</Text> : null}
            <View style={s.statsRow}>
              <View style={s.stat}>
                <Text style={[s.statValue, { color: GOLD }]}>+{d.xp}</Text>
                <Text style={s.statLabel}>XP</Text>
              </View>
              <View style={s.stat}>
                <Text style={s.statValue}>
                  {engine.score.total ? `${engine.score.correct}/${engine.score.total}` : '–'}
                </Text>
                <Text style={s.statLabel}>Câu đúng</Text>
              </View>
            </View>
            <View style={s.endActions}>
              <TouchableOpacity activeOpacity={0.85} onPress={engine.restart} style={s.ghostBtn}>
                <Text style={s.ghostBtnText}>Xem lại</Text>
              </TouchableOpacity>
              {d.unlockCharacters && chatCharacter && onOpenChat ? (
                <TouchableOpacity activeOpacity={0.85} onPress={openChat} style={[s.ghostBtn, { borderColor: GOLD }]}>
                  <Text style={[s.ghostBtnText, { color: GOLD }]}>Trò chuyện ngay</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            <TouchableOpacity activeOpacity={0.85} onPress={onComplete} style={[s.primaryBtn, { alignSelf: 'stretch' }]}>
              <Text style={s.primaryBtnText}>{completeLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {/* Nhanh chua noi tiep */}
      {engine.isDeadEnd ? (
        <View style={[s.overlayCenter, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
          <View style={s.endCard}>
            <Unplug size={30} color="#F08C74" />
            <Text style={[s.endTitle, { fontSize: 18 }]}>Câu chuyện dừng ở đây</Text>
            <Text style={s.endSummary}>Đoạn này chưa được nối tiếp. Bạn có thể xem lại hoặc đi tiếp tới các nhân vật.</Text>
            <View style={s.endActions}>
              <TouchableOpacity activeOpacity={0.85} onPress={engine.restart} style={s.ghostBtn}>
                <Text style={s.ghostBtnText}>Xem lại</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.85} onPress={onComplete} style={[s.primaryBtn, { flex: 1, marginTop: 0 }]}>
                <Text style={s.primaryBtnText}>{completeLabel}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : null}

      {/* Nhat ky */}
      {logOpen ? (
        <View style={s.logBackdrop}>
          <View style={[s.logPanel, { paddingTop: insets.top + 8, paddingBottom: insets.bottom }]}>
            <View style={s.logHead}>
              <History size={16} color={CREAM} />
              <Text style={{ color: CREAM, fontWeight: '700', flex: 1 }}>Nhật ký lời thoại</Text>
              <TouchableOpacity accessibilityLabel="Đóng" onPress={() => setLogOpen(false)} hitSlop={8}>
                <X size={18} color={CREAM} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 18, gap: 14 }}>
              {engine.log.length === 0 ? (
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Chưa có lời thoại nào.</Text>
              ) : null}
              {engine.log.map((entry) => (
                <View key={entry.id}>
                  <Text style={[s.logSpeaker, entry.speaker === 'Bạn' && { color: GOLD }]}>{entry.speaker}</Text>
                  <Text style={[s.logText, entry.tone === 'question' && { fontStyle: 'italic', color: 'rgba(255,255,255,0.75)' }]}>
                    {entry.text}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000', overflow: 'hidden' },
  portraitWrap: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '62%', alignItems: 'center' },
  portrait: { width: '100%', height: '100%' },
  silhouette: {
    position: 'absolute', bottom: 180, width: 120, height: 120, borderRadius: 60,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(245,242,234,0.35)',
  },

  topBar: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 12, gap: 8 },
  titleBox: { alignSelf: 'flex-start', maxWidth: '100%', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 4, paddingHorizontal: 10, paddingVertical: 6 },
  kicker: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '700', letterSpacing: 1.6, textTransform: 'uppercase' },
  title: { color: CREAM, fontSize: 13, fontWeight: '600' },
  controls: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  control: {
    height: 36, minWidth: 36, paddingHorizontal: 9, borderRadius: 4, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)', backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center',
  },
  controlActive: { backgroundColor: CREAM, borderColor: CREAM },
  controlHighlight: { backgroundColor: GOLD, borderColor: GOLD },

  dialogue: {
    position: 'absolute', left: 12, right: 12, minHeight: 128, paddingHorizontal: 18, paddingTop: 26, paddingBottom: 18,
    borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', backgroundColor: PANEL,
  },
  namePlate: { position: 'absolute', top: -14, left: 16, borderRadius: 4, paddingHorizontal: 10, paddingVertical: 4 },
  nameText: { color: CREAM, fontSize: 13, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  lineText: { color: CREAM, fontSize: 16, lineHeight: 26 },
  narration: { fontStyle: 'italic', color: '#E8E2D4' },
  nextHint: { position: 'absolute', right: 12, bottom: 8 },

  overlayCenter: {
    ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 16, paddingBottom: 170, backgroundColor: 'rgba(0,0,0,0.3)',
  },
  optionList: { width: '100%', gap: 10 },
  choice: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 13,
    borderRadius: 8, borderWidth: 1, borderColor: 'rgba(217,178,92,0.55)', backgroundColor: PANEL,
  },
  answer: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12,
    borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', backgroundColor: PANEL,
  },
  answerCorrect: { borderColor: '#7FB0A6', backgroundColor: '#3D6B63' },
  answerWrong: { borderColor: '#E0644A', backgroundColor: '#7A1F12' },
  optionBadge: {
    width: 24, height: 24, borderRadius: 4, borderWidth: 1, borderColor: CREAM, alignItems: 'center', justifyContent: 'center',
  },
  optionBadgeText: { color: CREAM, fontSize: 12, fontWeight: '700' },
  optionText: { color: CREAM, fontSize: 15, fontWeight: '600', flex: 1 },
  explain: { borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(14,12,11,0.92)', padding: 14 },
  explainTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  explainText: { color: 'rgba(255,255,255,0.85)', fontSize: 14, lineHeight: 21 },

  primaryBtn: { marginTop: 12, height: 44, borderRadius: 4, backgroundColor: CREAM, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  primaryBtnText: { color: '#111', fontSize: 14, fontWeight: '800' },
  ghostBtn: { flex: 1, height: 44, borderRadius: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' },
  ghostBtnText: { color: CREAM, fontSize: 14, fontWeight: '600' },

  endCard: {
    width: '100%', maxWidth: 420, alignItems: 'center', gap: 6, padding: 22, borderRadius: 8,
    borderWidth: 1, borderColor: 'rgba(217,178,92,0.4)', backgroundColor: 'rgba(14,12,11,0.94)',
  },
  trophy: { width: 52, height: 52, borderRadius: 26, backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  endTitle: { color: CREAM, fontSize: 24, fontWeight: '800', textAlign: 'center' },
  endSummary: { color: 'rgba(255,255,255,0.8)', fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 8, marginTop: 12, alignSelf: 'stretch' },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  statValue: { color: CREAM, fontSize: 20, fontWeight: '800' },
  statLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' },
  endActions: { flexDirection: 'row', gap: 8, marginTop: 14, alignSelf: 'stretch' },

  logBackdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'flex-end' },
  logPanel: { width: '88%', height: '100%', backgroundColor: 'rgba(14,12,11,0.97)', borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.1)' },
  logHead: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  logSpeaker: { color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  logText: { color: CREAM, fontSize: 14.5, lineHeight: 22, marginTop: 2 },
});
