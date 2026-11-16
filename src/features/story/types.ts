/**
 * Kich ban ke chuyen (visual novel) luu tren boi canh: `historicalContext.storyScript`.
 * Cung hinh dang voi web (src/features/story/types.ts) — staff soan tren web, mobile chi phat.
 */

export type StoryNodeKind = 'start' | 'line' | 'choice' | 'quiz' | 'end';

export type Expression = 'neutral' | 'happy' | 'serious' | 'sad' | 'angry' | 'surprised';

export type StoryOption = { id: string; label: string };

export type StartData = { kind: 'start'; note: string };

/** Mot cau thoai (hoac loi dan truyen khi khong co nguoi noi). */
export type LineData = {
  kind: 'line';
  speakerId: string | null;
  text: string;
  expression: Expression;
  /** Id phong nen; null = giu phong nen cua canh truoc. */
  background: string | null;
};

/** Nguoi hoc chon nhanh; moi lua chon la 1 cong ra (sourceHandle = option id). */
export type ChoiceData = {
  kind: 'choice';
  speakerId: string | null;
  prompt: string;
  options: StoryOption[];
};

/** Cau hoi kiem tra; cong ra "correct" va "wrong". */
export type QuizData = {
  kind: 'quiz';
  speakerId: string | null;
  question: string;
  answers: StoryOption[];
  correctId: string | null;
  explanation: string;
};

export type EndData = {
  kind: 'end';
  title: string;
  summary: string;
  xp: number;
  unlockCharacters: boolean;
};

export type StoryNodeData = StartData | LineData | ChoiceData | QuizData | EndData;

export type StoryNode = {
  id: string;
  type?: StoryNodeKind;
  position?: { x: number; y: number };
  data: StoryNodeData;
};

export type StoryEdge = {
  id?: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
};

export type StoryStatus = 'draft' | 'published';

export type StoryScript = {
  version: 1;
  title: string;
  narratorId: string | null;
  status: StoryStatus;
  updatedAt: string;
  nodes: StoryNode[];
  edges: StoryEdge[];
};

export type StoryCharacter = {
  id: string;
  name: string;
  title: string;
  portraitUrl: string | null;
  accent: string;
  /** Nhan vat goc, de mo chat. */
  source: { id: string };
};

export type StoryBackground = {
  id: string;
  name: string;
  /** Mau cho LinearGradient tu tren xuong (web dung CSS gradient). */
  colors: [string, string, ...string[]];
  locations?: [number, number, ...number[]];
};
