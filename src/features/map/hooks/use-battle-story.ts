import * as Speech from 'expo-speech';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { BattleMap, BattleSymbol, CameraRect } from '../battle-map';

/**
 * Phát diễn biến trận đánh theo từng cảnh — port useBattlePlayback/useBattleStory
 * của web. Mỗi câu thuyết minh đọc thành 1 lượt (expo-speech) và câu sau chỉ bắt
 * đầu khi câu trước đọc xong, nên phụ đề + giai đoạn trên lược đồ khớp với giọng.
 * Tắt tiếng thì câu chạy theo thời gian ước lượng.
 */

export interface PlaybackScene { id: string; title: string; text: string }

/** Cách 1 ký hiệu đang hiển thị: ẩn, mờ (giai đoạn trước), hoặc vừa xuất hiện. */
export interface SymbolView {
  hidden?: boolean;
  dim?: boolean;
  enter?: { delay: number; key: string };
}

export function splitSentences(text: string): string[] {
  return text.split(/(?<=[.!?…;])\s+|\n+/).map((s) => s.trim()).filter(Boolean);
}

/** Thời gian đọc ước lượng (~70ms/ký tự tiếng Việt). */
const estimateMs = (sentence: string) => Math.max(1800, sentence.length * 70);
/** Cảnh không có thuyết minh vẫn giữ đủ lâu để ký hiệu kịp hiện. */
const SILENT_SCENE_MS = 3500;

const sceneDurationMs = (text: string) => {
  const sentences = splitSentences(text);
  return sentences.length ? sentences.reduce((sum, s) => sum + estimateMs(s), 0) : SILENT_SCENE_MS;
};

interface PlaybackState { scene: number; sentence: number; playing: boolean; started: boolean; finished: boolean }
const INITIAL: PlaybackState = { scene: 0, sentence: 0, playing: false, started: false, finished: false };

function useBattlePlayback(scenes: PlaybackScene[], { voice }: { voice: boolean }) {
  const [state, setState] = useState(INITIAL);
  /** Tiến độ ước lượng của câu hiện tại (0–1), chỉ dùng cho thanh tiến độ. */
  const [fraction, setFraction] = useState(0);
  const scenesRef = useRef(scenes);
  useEffect(() => { scenesRef.current = scenes; });
  const textsKey = scenes.map((s) => s.text).join('\u0000');
  const scene = Math.min(state.scene, Math.max(0, scenes.length - 1));

  const advance = useCallback(() => setState((s) => {
    const count = splitSentences(scenesRef.current[s.scene]?.text ?? '').length;
    if (s.sentence + 1 < count) return { ...s, sentence: s.sentence + 1 };
    if (s.scene + 1 < scenesRef.current.length) return { ...s, scene: s.scene + 1, sentence: 0 };
    return { ...s, playing: false, finished: true };
  }), []);

  // Đọc (hoặc đếm giờ) câu hiện tại khi đang phát; đổi vị trí là huỷ câu đang đọc.
  useEffect(() => {
    if (!state.playing) return;
    const sentence = splitSentences(scenesRef.current[scene]?.text ?? '')[state.sentence];
    const duration = sentence ? estimateMs(sentence) : SILENT_SCENE_MS;
    const start = Date.now();
    let done = false;
    const finish = () => { if (!done) { done = true; advance(); } };

    const ticker = setInterval(() => setFraction(Math.min(0.97, (Date.now() - start) / duration)), 100);
    let timer: ReturnType<typeof setTimeout>;

    if (voice && sentence) {
      Speech.stop();
      Speech.speak(sentence, {
        language: 'vi-VN',
        rate: 0.9,
        onDone: finish,
        // Giọng lỗi giữa chừng → chạy tiếp bằng đồng hồ thay vì đứng trận
        onError: () => { timer = setTimeout(finish, Math.max(0, duration - (Date.now() - start))); },
      });
      // Phòng khi onDone không bao giờ tới
      timer = setTimeout(finish, duration * 2.5 + 4000);
    } else {
      timer = setTimeout(finish, duration);
    }

    return () => {
      done = true;
      clearInterval(ticker);
      clearTimeout(timer);
      void Speech.stop();
    };
  }, [state.playing, scene, state.sentence, voice, textsKey, advance]);

  // Rời màn hình → dừng đọc
  useEffect(() => () => { void Speech.stop(); }, []);

  const play = useCallback(() => {
    setFraction(0);
    setState((s) => (s.finished ? { ...INITIAL, playing: true, started: true } : { ...s, playing: true, started: true }));
  }, []);
  const pause = useCallback(() => setState((s) => ({ ...s, playing: false })), []);
  const toggle = useCallback(() => (state.playing ? pause() : play()), [state.playing, pause, play]);
  const restart = useCallback(() => { setFraction(0); setState({ ...INITIAL, playing: true, started: true }); }, []);
  /** Nhảy tới đầu 1 cảnh, giữ nguyên trạng thái phát/dừng. */
  const seek = useCallback((target: number) => {
    setFraction(0);
    setState((s) => ({ ...s, scene: target, sentence: 0, started: true, finished: false }));
  }, []);

  return { ...state, scene, fraction, play, pause, toggle, restart, seek };
}

/** Mọi thứ màn trận đánh cần: các cảnh, con trỏ phát và cách lược đồ hiển thị lúc này. */
export function useBattleStory(battleMap: BattleMap, legacyNarration: string, { voice }: { voice: boolean }) {
  const phases = useMemo(() => battleMap.phases ?? [], [battleMap.phases]);
  const legacy = legacyNarration.trim();
  // Mỗi giai đoạn 1 cảnh; lược đồ chưa chia giai đoạn thì đọc thuyết minh cũ của ghim
  const scenes = useMemo<PlaybackScene[]>(() => (phases.length
    ? phases.map((p) => ({ id: p.id, title: p.title, text: p.narration }))
    : [{ id: 'all', title: 'Diễn biến trận đánh', text: legacy }]), [phases, legacy]);
  const narration = useBattlePlayback(scenes, { voice });
  const scene = scenes[narration.scene];
  const sentences = splitSentences(scene?.text ?? '');
  const phaseOf = (symbol: BattleSymbol) => (symbol.phaseId ? phases.findIndex((p) => p.id === symbol.phaseId) : -1);
  const sceneSymbols = phases.length ? battleMap.symbols.filter((s) => phaseOf(s) === narration.scene) : [];
  // Trước lần phát đầu tiên hiện toàn bộ lược đồ
  const symbolView = phases.length && narration.started ? (s: BattleSymbol): SymbolView => {
    const i = phaseOf(s);
    if (i === -1) return {};
    if (i < narration.scene) return { dim: true };
    if (i > narration.scene) return { hidden: true };
    return { enter: { delay: 500 + sceneSymbols.indexOf(s) * 450, key: String(narration.scene) } };
  } : undefined;
  const currentPhase = narration.started ? phases[narration.scene] : undefined;
  const spotlight: CameraRect | null = currentPhase?.camera === 'frame' ? currentPhase.focus ?? null : null;
  const focus: CameraRect | BattleSymbol[] | null | undefined = !phases.length
    ? undefined
    : spotlight ?? (currentPhase?.camera === 'auto' ? sceneSymbols : null);
  const sceneWeights = scenes.map((sc) => sceneDurationMs(sc.text));
  const sceneProgress = (i: number) => (i < narration.scene || narration.finished ? 1 : i > narration.scene ? 0
    : Math.min(1, (narration.sentence + narration.fraction) / Math.max(1, sentences.length)));
  return {
    phases, scenes, narration, scene, sentences, symbolView, focus, sceneWeights, sceneProgress,
    hasStory: phases.length > 0 || !!legacy,
  };
}
