import type { StoryBackground, StoryEdge, StoryNode, StoryNodeKind, StoryScript } from './types';

const KINDS: StoryNodeKind[] = ['start', 'line', 'choice', 'quiz', 'end'];

/** Kiem tra hinh dang kich ban BE tra ve (co the la JSON string hoac object). */
export function parseStoryScript(value: unknown): StoryScript | null {
  let raw = value;
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (!raw || typeof raw !== 'object') return null;
  const s = raw as StoryScript;
  const ok =
    typeof s.title === 'string' &&
    (s.status === 'draft' || s.status === 'published') &&
    Array.isArray(s.nodes) &&
    Array.isArray(s.edges) &&
    s.nodes.every((n: StoryNode) => n && typeof n.id === 'string' && !!n.data && KINDS.includes(n.data.kind)) &&
    s.edges.every((e: StoryEdge) => e && typeof e.source === 'string' && typeof e.target === 'string') &&
    s.nodes.some((n) => n.data.kind === 'start');
  return ok ? s : null;
}

/** Kich ban nguoi hoc phat duoc: da xuat ban va co it nhat 1 buoc sau Bat dau. */
export function isPlayableScript(value: StoryScript | null | undefined): value is StoryScript {
  return !!value && value.status === 'published' && value.nodes.length > 1;
}

export function nextNodeId(edges: StoryEdge[], source: string, handle: string): string | null {
  return edges.find((e) => e.source === source && (e.sourceHandle ?? 'next') === handle)?.target ?? null;
}

export function firstBackground(script: StoryScript): string | null {
  for (const n of script.nodes) if (n.data.kind === 'line' && n.data.background) return n.data.background;
  return null;
}

// Phong nen giong web; 2 phong nen anh cua web (banner/war) dung gradient tuong ung.
export const STORY_BACKGROUNDS: StoryBackground[] = [
  {
    id: 'river-dawn',
    name: 'Sông lúc bình minh',
    colors: ['#F7C98B', '#E58B5A', '#9B5A4A', '#2F4A5C', '#14232E'],
    locations: [0, 0.34, 0.5, 0.64, 1],
  },
  { id: 'river-night', name: 'Sông về đêm', colors: ['#0E1824', '#1B2C3D', '#0A121A'], locations: [0, 0.55, 1] },
  { id: 'camp', name: 'Doanh trại', colors: ['#1E1612', '#3A2418', '#7A3A1E', '#140E0B'], locations: [0, 0.55, 0.8, 1] },
  { id: 'battle', name: 'Trận chiến', colors: ['#2A1410', '#5A2A1E', '#C2482F', '#16090A'], locations: [0, 0.35, 0.7, 1] },
  { id: 'palace', name: 'Cung điện', colors: ['#E8C26A', '#7A1F12', '#4A120B', '#2A0A06'], locations: [0, 0.3, 0.7, 1] },
  { id: 'scroll', name: 'Giấy dó', colors: ['#F5F2EA', '#E2DCCF', '#C9BFA8'], locations: [0, 0.7, 1] },
  { id: 'banner', name: 'Anh hùng dân tộc', colors: ['#3A1A12', '#7A1F12', '#1A0C08'], locations: [0, 0.5, 1] },
  { id: 'war', name: 'Chiến trận', colors: ['#3B2A1E', '#6B4A2E', '#1A120C'], locations: [0, 0.5, 1] },
];

export const DEFAULT_BACKGROUND = 'scroll';

export function findBackground(id: string | null | undefined): StoryBackground {
  return (
    STORY_BACKGROUNDS.find((b) => b.id === id) ?? STORY_BACKGROUNDS.find((b) => b.id === DEFAULT_BACKGROUND)!
  );
}

/** Phong nen sang (giay do) thi chu tren nen phai toi. */
export function isLightBackground(id: string | null | undefined) {
  return findBackground(id).id === 'scroll';
}

const ACCENTS = ['#B8321F', '#9A7426', '#3D6B63', '#2F4A5C', '#7A1F12', '#6F6A62'];

export function toStoryCharacter(
  c: { id: string; name: string; title?: string | null; imageUrl?: string | null; image?: string | null },
  i = 0,
) {
  return {
    id: c.id,
    name: c.name,
    title: c.title ?? '',
    portraitUrl: c.imageUrl ?? c.image ?? null,
    accent: ACCENTS[i % ACCENTS.length],
    source: { id: c.id },
  };
}

export const NARRATOR_LABEL = 'Người dẫn truyện';
