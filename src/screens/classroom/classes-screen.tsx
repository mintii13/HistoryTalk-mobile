import { useRouter } from 'expo-router';
import {
  BookOpen,
  ChartColumn,
  ClipboardList,
  Hash,
  GraduationCap,
  Landmark,
  Map,
  MessageCircle,
  Users,
} from 'lucide-react-native';
import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SchoolQuotaCard } from '@/components/student/school-quota-card';
import {
  AssignmentRow,
  EmptyState,
  GOLD,
  JADE,
  ListSkeleton,
  MEN_LAM,
  Pill,
  Section,
} from '@/components/student/student-ui';
import { Text } from '@/components/ui/text';
import { BORDER, CARD, MUTED, ORANGE, TEXT, TEXT2 } from '@/constants/palette';
import { assignmentBucket, isOpenBucket, sortByUrgency } from '@/features/assignments/meta';
import { useStudentAssignments } from '@/features/assignments/hooks';
import { useMe } from '@/features/auth/hooks/use-me';
import { useMyClassrooms, useStudentDashboard } from '@/features/classroom/hooks';
import { CLASSROOM_STATUS, classroomMeta, type Classroom } from '@/features/classroom/types';
import { materialHref, useStudentMaterials } from '@/features/local-contents/hooks';

function greeting(hour: number) {
  if (hour < 11) return 'Chào buổi sáng';
  if (hour < 13) return 'Chào buổi trưa';
  if (hour < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
}

const LIBRARY = [
  { label: 'Sự kiện', icon: Landmark, href: '/context', color: JADE },
  { label: 'Nhân vật', icon: Users, href: '/characters', color: GOLD },
  { label: 'Câu đố', icon: ClipboardList, href: '/quiz', color: MEN_LAM },
  { label: 'Bản đồ', icon: Map, href: '/map', color: ORANGE },
] as const;

/** Trang chu cua hoc sinh — ban mobile cua web /classes (StudentWorkspace). */
export default function ClassesScreen() {
  const router = useRouter();
  const me = useMe();
  const classes = useMyClassrooms();
  const assignments = useStudentAssignments({ page: 0, size: 50 });
  const materials = useStudentMaterials();
  const dashboard = useStudentDashboard();
  const [refreshing, setRefreshing] = useState(false);

  async function onRefresh() {
    setRefreshing(true);
    try {
      await Promise.all([classes.refetch(), assignments.refetch(), materials.refetch(), dashboard.refetch()]);
    } finally {
      setRefreshing(false);
    }
  }

  const now = new Date();
  const name = me.data?.fullName?.trim().split(/\s+/).pop() || me.data?.userName || 'em';
  const classList = classes.data ?? [];
  const schoolName = dashboard.data?.schoolName ?? classList[0]?.schoolName;
  const allAssignments = assignments.data?.items ?? [];
  const open = sortByUrgency(allAssignments.filter((a) => isOpenBucket(assignmentBucket(a))));
  const recentMaterials = [...(materials.data ?? [])]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 4);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={ORANGE} />}
      >
        <View style={{ gap: 4 }}>
          <Text style={s.date}>
            {now.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
          </Text>
          <Text style={s.hello}>{greeting(now.getHours())}, {name}!</Text>
          {classList.length > 0 ? (
            <Text style={s.sub} numberOfLines={2}>
              Lớp {classList.map((c) => c.className).join(', ')}{schoolName ? ` · ${schoolName}` : ''}
            </Text>
          ) : null}
        </View>

        <Section
          title="Bài cần làm"
          action={allAssignments.length > 0 ? { label: `Tất cả (${assignments.data?.totalElements ?? allAssignments.length})`, onPress: () => router.push('/assignments' as never) } : undefined}
        >
          {assignments.isLoading ? (
            <Text style={s.sub}>Đang tải bài tập...</Text>
          ) : assignments.isError ? (
            <TouchableOpacity onPress={() => void assignments.refetch()}>
              <Text style={s.sub}>Không tải được bài tập. Chạm để thử lại.</Text>
            </TouchableOpacity>
          ) : open.length === 0 ? (
            <Text style={s.sub}>{allAssignments.length > 0 ? 'Bạn đã làm hết bài. Tuyệt vời!' : 'Chưa có bài tập.'}</Text>
          ) : (
            <View style={{ gap: 10 }}>
              {open.slice(0, 5).map((a) => (
                <AssignmentRow
                  key={a.assignmentId}
                  assignment={a}
                  onPress={() => router.push(`/assignments/${a.assignmentId}` as never)}
                />
              ))}
            </View>
          )}
        </Section>

        <SchoolQuotaCard />

        <Section
          title="Kho tư liệu"
          description="Bài đọc và nhân vật thầy cô chuẩn bị cho bạn."
          action={(materials.data?.length ?? 0) > 0 ? { label: `Tất cả (${materials.data!.length})`, onPress: () => router.push('/classes/materials' as never) } : undefined}
        >
          {recentMaterials.length === 0 ? (
            <Text style={s.sub}>
              {materials.isLoading ? 'Đang tải tư liệu...' : 'Chưa có tư liệu. Thầy cô đăng tư liệu nào sẽ hiện ở đây.'}
            </Text>
          ) : (
            <View>
              {recentMaterials.map((m, i) => (
                <TouchableOpacity
                  key={`${m.type}-${m.id}`}
                  activeOpacity={0.7}
                  onPress={() => router.push(materialHref(m) as never)}
                  style={[s.row, i > 0 && s.rowDivider]}
                >
                  {m.type === 'CHARACTER' ? <Users size={18} color={GOLD} /> : <BookOpen size={18} color={JADE} />}
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={s.rowTitle} numberOfLines={1}>{m.name}</Text>
                    <Text style={s.rowMeta}>{m.type === 'CHARACTER' ? 'Nhân vật' : 'Bối cảnh'}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Section>

        <View style={{ gap: 10 }}>
          <Text style={s.blockTitle}>Lớp của bạn</Text>
          {classes.isLoading ? (
            <ListSkeleton count={1} height={140} />
          ) : classes.isError ? (
            <EmptyState
              title="Không tải được lớp học"
              description={classes.error?.message}
              action={{ label: 'Thử lại', onPress: () => void classes.refetch() }}
            />
          ) : classList.length === 0 ? (
            <EmptyState icon={GraduationCap} title="Bạn chưa thuộc lớp nào" description="Liên hệ giáo viên hoặc quản trị trường." />
          ) : (
            classList.map((c) => <ClassCard key={c.id} classroom={c} onOpen={() => router.push(`/classes/${c.id}` as never)} />)
          )}
        </View>

        <View style={s.libraryCard}>
          <Text style={s.blockTitle}>Thư viện HistoryTalk</Text>
          <Text style={s.sub}>Sự kiện, nhân vật và câu đố chính thống dành cho mọi người học.</Text>
          <View style={s.libraryGrid}>
            {LIBRARY.map(({ label, icon: Icon, href, color }) => (
              <TouchableOpacity key={href} onPress={() => router.push(href as never)} activeOpacity={0.75} style={s.libraryTile}>
                <View style={[s.libraryIcon, { backgroundColor: `${color}1F` }]}>
                  <Icon size={20} color={color} />
                </View>
                <Text style={s.libraryLabel}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={s.quickLinks}>
            <TouchableOpacity onPress={() => router.push('/grades' as never)} style={s.quickLink} activeOpacity={0.75}>
              <ChartColumn size={16} color={ORANGE} />
              <Text style={s.quickLinkText}>Bảng điểm</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/chat/history' as never)} style={s.quickLink} activeOpacity={0.75}>
              <MessageCircle size={16} color={ORANGE} />
              <Text style={s.quickLinkText}>Lịch sử trò chuyện</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ClassCard({ classroom: c, onOpen }: { classroom: Classroom; onOpen: () => void }) {
  const status = CLASSROOM_STATUS[c.status] ?? { label: c.status, tone: 'neutral' as const };
  return (
    <View style={s.classCard}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={s.classLabel}>Lớp của bạn</Text>
        <Pill label={status.label} tone={status.tone} />
      </View>
      <Text style={s.className}>Lớp {c.className}</Text>
      <Text style={s.sub}>{classroomMeta(c)}</Text>
      <Text style={s.sub}>
        {c.teacher?.fullName ? `GV ${c.teacher.fullName}` : 'Chưa có giáo viên phụ trách'} · {c.studentCount} học sinh
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
        <View style={s.codeBtn} accessibilityLabel={`Mã lớp ${c.classCode}`}>
          <Hash size={14} color={TEXT2} />
          <Text style={s.code} numberOfLines={1} selectable>{c.classCode}</Text>
        </View>
        <TouchableOpacity onPress={onOpen} style={s.enterBtn} activeOpacity={0.8}>
          <Text style={s.enterText}>Vào lớp</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  date: { color: MUTED, fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  hello: { color: TEXT, fontSize: 24, fontWeight: '900' },
  sub: { color: MUTED, fontSize: 13, lineHeight: 18 },
  blockTitle: { color: TEXT, fontSize: 16, fontWeight: '800' },

  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  rowDivider: { borderTopWidth: 1, borderTopColor: BORDER },
  rowTitle: { color: TEXT, fontSize: 14, fontWeight: '700' },
  rowMeta: { color: MUTED, fontSize: 12 },

  classCard: { backgroundColor: CARD, borderRadius: 12, borderWidth: 1, borderColor: BORDER, padding: 16, gap: 3 },
  classLabel: { color: MUTED, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  className: { color: TEXT, fontSize: 20, fontWeight: '900', marginTop: 4 },
  codeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44,
    borderRadius: 12, borderWidth: 1, borderColor: BORDER, paddingHorizontal: 12,
  },
  code: { flex: 1, color: TEXT2, fontSize: 13, fontWeight: '700' },
  enterBtn: { minHeight: 44, borderRadius: 12, backgroundColor: ORANGE, paddingHorizontal: 18, justifyContent: 'center' },
  enterText: { color: '#fff', fontSize: 14, fontWeight: '800' },

  libraryCard: { backgroundColor: CARD, borderRadius: 12, borderWidth: 1, borderColor: BORDER, padding: 16, gap: 6 },
  libraryGrid: { flexDirection: 'row', gap: 8, marginTop: 8 },
  libraryTile: { flex: 1, alignItems: 'center', gap: 6, paddingVertical: 8 },
  libraryIcon: { width: 48, height: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  libraryLabel: { color: TEXT, fontSize: 12, fontWeight: '700' },
  quickLinks: { flexDirection: 'row', gap: 8, marginTop: 6 },
  quickLink: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 44,
    borderRadius: 12, borderWidth: 1, borderColor: BORDER,
  },
  quickLinkText: { color: TEXT, fontSize: 13, fontWeight: '700' },
});
