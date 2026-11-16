import AsyncStorage from '@react-native-async-storage/async-storage';

import { SYMBOL_LABELS, type BattleMap, type BattleSymbol } from './battle-map';
import type { BattleMapScore } from './battle-map-scoring';

/**
 * Ket qua "Thu thach tri nho" va ban ve nhap, chi luu tren may nay (AsyncStorage) theo nguoi dung
 * va tran danh — giong web luu localStorage, khong gui len may chu.
 */

export interface PracticeRecord {
  /** Phan tram cao nhat. */
  best: number;
  /** Phan tram lan so sanh gan nhat. */
  last: number;
  attempts: number;
}

export type PracticeKind = 'challenge' | 'sketch';

const recordKey = (uid: string | undefined, eventId: string) =>
  `historytalk:battle-practice:v1:${uid ?? 'anonymous'}:${eventId}`;
const draftKey = (uid: string | undefined, eventId: string, kind: PracticeKind) =>
  `historytalk:battle-draft:v1:${uid ?? 'anonymous'}:${kind}:${eventId}`;
export const PRACTICE_INTRO_KEY = 'historytalk:battle-practice:intro-seen';

const isRecord = (value: unknown): value is PracticeRecord => {
  const r = value as PracticeRecord | null;
  return !!r && typeof r.best === 'number' && typeof r.last === 'number' && typeof r.attempts === 'number';
};

async function readJson(key: string): Promise<unknown> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function readPracticeRecord(uid: string | undefined, eventId: string) {
  const value = await readJson(recordKey(uid, eventId));
  return isRecord(value) ? value : null;
}

/** Them 1 lan so sanh; tra ve ky luc truoc va sau de man ket qua hien tien bo. */
export async function savePracticeScore(uid: string | undefined, eventId: string, percent: number) {
  const previous = await readPracticeRecord(uid, eventId);
  const record: PracticeRecord = {
    best: Math.max(previous?.best ?? 0, percent),
    last: percent,
    attempts: (previous?.attempts ?? 0) + 1,
  };
  try {
    await AsyncStorage.setItem(recordKey(uid, eventId), JSON.stringify(record));
  } catch {
    // Khong luu duoc: van hien ket qua, chi la khong nho.
  }
  return { previous, record };
}

export async function readPracticeDraft(uid: string | undefined, eventId: string, kind: PracticeKind) {
  const value = (await readJson(draftKey(uid, eventId, kind))) as { symbols?: unknown; factions?: unknown } | null;
  if (!value || !Array.isArray(value.symbols)) return null;
  return { symbols: value.symbols as BattleSymbol[], factions: Array.isArray(value.factions) ? (value.factions as BattleMap['factions']) : null };
}

export async function writePracticeDraft(uid: string | undefined, eventId: string, kind: PracticeKind, map: BattleMap | null) {
  try {
    const key = draftKey(uid, eventId, kind);
    if (map && map.symbols.length) await AsyncStorage.setItem(key, JSON.stringify({ symbols: map.symbols, factions: map.factions }));
    else await AsyncStorage.removeItem(key);
  } catch {
    // Khong luu duoc ban nhap: bai ve chi con trong phien nay.
  }
}

export async function hasSeenPracticeIntro() {
  try {
    return (await AsyncStorage.getItem(PRACTICE_INTRO_KEY)) !== null;
  } catch {
    return false;
  }
}

export async function markPracticeIntroSeen() {
  try {
    await AsyncStorage.setItem(PRACTICE_INTRO_KEY, 'seen');
  } catch {
    // ignore
  }
}

export interface PracticeRank {
  /** 0 den 3. */
  stars: number;
  title: string;
  message: string;
}

/** Cap bac quan su theo phan tram — phan thuong nhe (giong web). */
export function practiceRank(percent: number): PracticeRank {
  if (percent >= 90) return { stars: 3, title: 'Nguyên soái', message: 'Lược đồ của bạn gần như trùng khớp với bản gốc.' };
  if (percent >= 70) return { stars: 2, title: 'Tướng quân', message: 'Bạn nắm chắc diễn biến, chỉ còn lệch vài chỗ.' };
  if (percent >= 40) return { stars: 1, title: 'Hiệu úy', message: 'Đã có khung trận đánh. Bổ sung các ký hiệu còn thiếu để lên hạng.' };
  return { stars: 0, title: 'Tân binh', message: 'Xem các ký hiệu màu đỏ trên lược đồ rồi vẽ tiếp nhé.' };
}

export const PRACTICE_RANK_FLOORS = [0, 40, 70, 90];

export function nextRankAt(percent: number): number | null {
  return PRACTICE_RANK_FLOORS.find((t) => percent < t) ?? null;
}

export interface MissingHint {
  key: string;
  label: string;
  faction: string | null;
  color: string | null;
  count: number;
}

/** Ky hieu goc con thieu, gom theo loai va phe, nhieu nhat truoc: "2 × Tiến công (quân Đại Việt)". */
export function missingHints(answer: BattleMap, score: BattleMapScore): MissingHint[] {
  const missed = new Set(score.missedIds);
  const groups = new Map<string, MissingHint>();
  for (const s of answer.symbols) {
    if (!missed.has(s.id)) continue;
    const faction = answer.factions.find((f) => f.id === s.factionId) ?? null;
    const key = `${s.type}:${s.factionId}`;
    const group = groups.get(key);
    if (group) group.count += 1;
    else groups.set(key, { key, label: SYMBOL_LABELS[s.type], faction: faction?.name ?? null, color: faction?.color ?? null, count: 1 });
  }
  return [...groups.values()].sort((a, b) => b.count - a.count);
}
