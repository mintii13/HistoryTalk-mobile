import {
  AlertCircle,
  BookOpenText,
  ChevronRight,
  ClipboardCheck,
  MessageCircle,
} from 'lucide-react-native';
import type { ComponentType, ReactNode } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { ScreenHeader as BaseScreenHeader } from '@/components/screen-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { AMBER, BORDER, CARD, GOLD, GREEN, JADE, MEN_LAM, MUTED, ORANGE, RED, SURFACE, TEXT, TEXT2 } from '@/constants/palette';
import {
  assignmentBucket,
  formatDateTime,
  formatScore,
  relativeDue,
  statusBadge,
  type StatusTone,
} from '@/features/assignments/meta';
import type { AssignmentType, StudentAssignment } from '@/features/assignments/types';

export { GOLD, JADE, MEN_LAM } from '@/constants/palette';

type IconType = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

export const TONE_COLOR: Record<StatusTone, string> = {
  neutral: MUTED,
  warning: AMBER,
  success: GREEN,
  danger: RED,
};

export const ASSIGNMENT_TYPE_STYLE: Record<AssignmentType, { icon: IconType; color: string }> = {
  CONTEXT_READING: { icon: BookOpenText, color: JADE },
  AI_CHAT_ROLEPLAY: { icon: MessageCircle, color: GOLD },
  QUIZ_TEST: { icon: ClipboardCheck, color: MEN_LAM },
};

/** Thanh tieu de cho cac man cua hoc sinh: khong con lich su thi ve "Lớp học". */
export function ScreenHeader(props: { title: string; back?: boolean; right?: ReactNode }) {
  return <BaseScreenHeader fallbackHref="/classes" {...props} />;
}

export function Pill({ label, tone = 'neutral', color }: { label: string; tone?: StatusTone; color?: string }) {
  const c = color ?? TONE_COLOR[tone];
  return (
    <View style={[s.pill, { borderColor: `${c}55`, backgroundColor: `${c}14` }]}>
      <Text style={[s.pillText, { color: c }]} numberOfLines={1}>{label}</Text>
    </View>
  );
}

export function TypeTile({ type, size = 40 }: { type: AssignmentType; size?: number }) {
  const { icon: Icon, color } = ASSIGNMENT_TYPE_STYLE[type] ?? ASSIGNMENT_TYPE_STYLE.CONTEXT_READING;
  return (
    <View style={[s.typeTile, { width: size, height: size, borderRadius: size * 0.3, backgroundColor: `${color}1F` }]}>
      <Icon size={size * 0.5} color={color} strokeWidth={2} />
    </View>
  );
}

export function ScoreChip({ score, large }: { score: number | null | undefined; large?: boolean }) {
  const text = formatScore(score);
  if (!text) return null;
  const color = (score ?? 0) >= 8 ? GREEN : (score ?? 0) >= 5 ? AMBER : RED;
  return (
    <View style={[s.scoreChip, { borderColor: `${color}66` }, large && { paddingHorizontal: 14, paddingVertical: 8 }]}>
      <Text style={[s.scoreText, { color }, large && { fontSize: 18 }]}>{text}</Text>
    </View>
  );
}

/** "Hạn dd/mm/yyyy hh:mm · còn X" — mau theo muc do gap. */
export function DueLine({ assignment, compact }: { assignment: StudentAssignment; compact?: boolean }) {
  const bucket = assignmentBucket(assignment);
  const settled = bucket === 'DONE' || bucket === 'EXEMPTED';
  const color = settled ? MUTED : bucket === 'OVERDUE' ? RED : bucket === 'DUE_SOON' ? GOLD : TEXT2;
  return (
    <Text style={[s.due, { color }]} numberOfLines={1}>
      {compact ? 'Hạn ' : 'Hạn nộp '}
      {formatDateTime(assignment.deadline)}
      {settled ? '' : ` · ${relativeDue(assignment.deadline)}`}
    </Text>
  );
}

/** 1 dong bai tap trong danh sach. */
export function AssignmentRow({ assignment, onPress, showClass = true }: {
  assignment: StudentAssignment;
  onPress: () => void;
  showClass?: boolean;
}) {
  const badge = statusBadge(assignment);
  return (
    <TouchableOpacity activeOpacity={0.75} onPress={onPress} style={s.assignmentRow}>
      <TypeTile type={assignment.assignmentType} />
      <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <Pill label={badge.label} tone={badge.tone} />
          {assignment.score != null ? <ScoreChip score={assignment.score} /> : null}
        </View>
        <Text style={s.rowTitle} numberOfLines={2}>{assignment.title}</Text>
        {showClass ? (
          <Text style={s.rowMeta} numberOfLines={1}>
            Lớp {assignment.className} · {assignment.targetTitle ?? 'Không rõ nội dung'}
          </Text>
        ) : (
          <Text style={s.rowMeta} numberOfLines={1}>{assignment.targetTitle ?? 'Không rõ nội dung'}</Text>
        )}
        <DueLine assignment={assignment} compact />
      </View>
      <ChevronRight size={18} color={MUTED} />
    </TouchableOpacity>
  );
}

export function Section({ title, description, action, children, style }: {
  title: string;
  description?: string;
  action?: { label: string; onPress: () => void };
  children: ReactNode;
  style?: object;
}) {
  return (
    <View style={[s.section, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Text style={s.sectionTitle}>{title}</Text>
          {description ? <Text style={s.sectionDesc}>{description}</Text> : null}
        </View>
        {action ? (
          <TouchableOpacity onPress={action.onPress} hitSlop={8} style={s.linkRow}>
            <Text style={s.link}>{action.label}</Text>
            <ChevronRight size={14} color={ORANGE} />
          </TouchableOpacity>
        ) : null}
      </View>
      <View style={{ marginTop: 12 }}>{children}</View>
    </View>
  );
}

export function EmptyState({ icon: Icon = AlertCircle, title, description, action }: {
  icon?: IconType;
  title: string;
  description?: string;
  action?: { label: string; onPress: () => void };
}) {
  return (
    <View style={s.empty}>
      <Icon size={36} color={MUTED} strokeWidth={1.6} />
      <Text style={s.emptyTitle}>{title}</Text>
      {description ? <Text style={s.emptyDesc}>{description}</Text> : null}
      {action ? (
        <TouchableOpacity onPress={action.onPress} style={s.primaryBtn} activeOpacity={0.8}>
          <Text style={s.primaryBtnText}>{action.label}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export function ListSkeleton({ count = 3, height = 92 }: { count?: number; height?: number }) {
  return (
    <View style={{ padding: 20, gap: 12 }}>
      {Array.from({ length: count }, (_, i) => <Skeleton key={i} style={{ height, borderRadius: 12 }} />)}
    </View>
  );
}

export function StatTile({ label, value, sub, color = ORANGE, onPress }: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity disabled={!onPress} onPress={onPress} activeOpacity={0.75} style={s.statTile}>
      <Text style={s.statLabel} numberOfLines={1}>{label}</Text>
      <Text style={[s.statValue, { color }]} numberOfLines={1}>{value}</Text>
      {sub ? <Text style={s.statSub} numberOfLines={1}>{sub}</Text> : null}
    </TouchableOpacity>
  );
}

export function Meter({ value, max, color = ORANGE }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <View style={s.meterTrack}>
      <View style={[s.meterFill, { width: `${pct}%`, backgroundColor: color }]} />
    </View>
  );
}

/** Thanh chon tab dang chip, cuon ngang khi hep. */
export function ChipTabs<T extends string>({ value, options, onChange }: {
  value: T;
  options: { value: T; label: string; color?: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <View style={s.chipRow}>
      {options.map((o) => {
        const active = o.value === value;
        const color = o.color ?? ORANGE;
        return (
          <TouchableOpacity
            key={o.value}
            onPress={() => onChange(o.value)}
            activeOpacity={0.75}
            style={[s.chip, active && { backgroundColor: color, borderColor: color }]}
          >
            <Text style={[s.chipText, active && { color: '#fff' }]} numberOfLines={1}>{o.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export const studentStyles = StyleSheet.create({
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: ORANGE, borderRadius: 10, paddingHorizontal: 18, minHeight: 48,
  },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: CARD, borderRadius: 10, borderWidth: 1, borderColor: BORDER, paddingHorizontal: 18, minHeight: 48,
  },
  secondaryBtnText: { color: TEXT, fontSize: 15, fontWeight: '700' },
  hint: { color: TEXT2, fontSize: 13, lineHeight: 19 },
});

const s = StyleSheet.create({
  pill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start' },
  pillText: { fontSize: 11, fontWeight: '800' },

  typeTile: { alignItems: 'center', justifyContent: 'center' },

  scoreChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: SURFACE },
  scoreText: { fontSize: 12, fontWeight: '900' },

  due: { fontSize: 12, fontWeight: '600' },

  assignmentRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: CARD, borderRadius: 12, borderWidth: 1, borderColor: BORDER, padding: 14,
  },
  rowTitle: { color: TEXT, fontSize: 15, fontWeight: '700', lineHeight: 20 },
  rowMeta: { color: MUTED, fontSize: 12 },

  section: { backgroundColor: CARD, borderRadius: 12, borderWidth: 1, borderColor: BORDER, padding: 16 },
  sectionTitle: { color: TEXT, fontSize: 15, fontWeight: '800' },
  sectionDesc: { color: MUTED, fontSize: 12, marginTop: 2 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingTop: 2 },
  link: { color: ORANGE, fontSize: 13, fontWeight: '700' },

  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 32, paddingHorizontal: 24, gap: 8 },
  emptyTitle: { color: TEXT, fontSize: 16, fontWeight: '800', textAlign: 'center' },
  emptyDesc: { color: TEXT2, fontSize: 13, textAlign: 'center', lineHeight: 19 },
  primaryBtn: { marginTop: 6, backgroundColor: ORANGE, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 11 },
  primaryBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },

  statTile: {
    flexGrow: 1, flexBasis: '45%', minWidth: 140,
    backgroundColor: CARD, borderRadius: 12, borderWidth: 1, borderColor: BORDER, padding: 14, gap: 2,
  },
  statLabel: { color: MUTED, fontSize: 12, fontWeight: '700' },
  statValue: { fontSize: 22, fontWeight: '900' },
  statSub: { color: MUTED, fontSize: 11 },

  meterTrack: { height: 8, borderRadius: 4, backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, overflow: 'hidden' },
  meterFill: { height: '100%', borderRadius: 4 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, minHeight: 36, justifyContent: 'center',
    backgroundColor: CARD, borderWidth: 1, borderColor: BORDER,
  },
  chipText: { color: TEXT2, fontSize: 13, fontWeight: '700' },
});
