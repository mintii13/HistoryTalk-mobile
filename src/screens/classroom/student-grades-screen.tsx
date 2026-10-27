import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  ChipTabs,
  EmptyState,
  JADE,
  ListSkeleton,
  MEN_LAM,
  Pill,
  ScoreChip,
  ScreenHeader,
  Section,
  StatTile,
  TypeTile,
} from '@/components/student/student-ui';
import { Text } from '@/components/ui/text';
import { AMBER, BORDER, GREEN, MUTED, ORANGE, RED, TEXT } from '@/constants/palette';
import { useStudentAssignments } from '@/features/assignments/hooks';
import {
  ASSIGNMENT_TYPE_META,
  assignmentBucket,
  averageScore,
  formatDateTime,
  isDone,
  sortByDeadline,
  statusBadge,
} from '@/features/assignments/meta';
import { todayQuota, useStudentDashboard } from '@/features/classroom/hooks';

const fmt = (n: number) => n.toLocaleString('vi-VN');

/** Bang diem cua hoc sinh — ban mobile cua web /grades (StudentGradeBook + StudentPersonalDashboard). */
export default function StudentGradesScreen() {
  const router = useRouter();
  const assignments = useStudentAssignments({ page: 0, size: 100 });
  const dashboard = useStudentDashboard();
  const [classFilter, setClassFilter] = useState('ALL');

  const items = useMemo(() => assignments.data?.items ?? [], [assignments.data]);
  const classes = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of items) map.set(a.classroomId, a.className);
    return [...map.entries()];
  }, [items]);
  const visible = sortByDeadline(items.filter((a) => classFilter === 'ALL' || a.classroomId === classFilter), 'desc');
  const counted = visible.filter((a) => a.submissionStatus !== 'EXEMPTED');
  const avg = averageScore(visible);
  const scoredCount = visible.filter((a) => a.score != null).length;
  const upcoming = sortByDeadline(
    items.filter((a) => ['TODO', 'DUE_SOON'].includes(assignmentBucket(a))),
    'asc',
  ).slice(0, 5);
  const quota = todayQuota(dashboard.data);
  const d = dashboard.data;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top']}>
      <ScreenHeader title="Bảng điểm" />
      {assignments.isLoading ? (
        <ListSkeleton count={4} />
      ) : assignments.isError ? (
        <EmptyState
          title="Không tải được bảng điểm"
          description={assignments.error?.message}
          action={{ label: 'Thử lại', onPress: () => void assignments.refetch() }}
        />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 48 }}
          refreshControl={
            <RefreshControl
              refreshing={assignments.isRefetching || dashboard.isRefetching}
              onRefresh={() => {
                void assignments.refetch();
                void dashboard.refetch();
              }}
              tintColor={ORANGE}
            />
          }
        >
          <Section title="Điểm bài tập" description="Điểm thang 10 do hệ thống tự chấm khi bạn nộp bài.">
            <View style={s.stats}>
              <StatTile
                label="Điểm trung bình"
                value={avg == null ? '—' : avg.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}
                sub={`Trên ${scoredCount} bài có điểm`}
              />
              <StatTile
                label="Đã nộp"
                value={`${counted.filter((a) => isDone(a.submissionStatus)).length}/${counted.length}`}
                sub="Không tính bài được miễn"
                color={JADE}
              />
            </View>
            {classes.length > 1 ? (
              <View style={{ marginTop: 12 }}>
                <ChipTabs
                  value={classFilter}
                  onChange={setClassFilter}
                  options={[{ value: 'ALL', label: 'Tất cả lớp' }, ...classes.map(([id, name]) => ({ value: id, label: `Lớp ${name}` }))]}
                />
              </View>
            ) : null}
            {visible.length === 0 ? (
              <Text style={[s.meta, { marginTop: 12 }]}>Chưa có bài tập nào.</Text>
            ) : (
              <View style={{ marginTop: 8 }}>
                {visible.map((a, i) => {
                  const badge = statusBadge(a);
                  return (
                    <TouchableOpacity
                      key={a.assignmentId}
                      activeOpacity={0.7}
                      onPress={() => router.push(`/assignments/${a.assignmentId}` as never)}
                      style={[s.row, i > 0 && s.divider]}
                    >
                      <TypeTile type={a.assignmentType} size={34} />
                      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
                        <Text style={s.rowTitle} numberOfLines={2}>{a.title}</Text>
                        <Text style={s.meta} numberOfLines={1}>
                          Lớp {a.className} · {ASSIGNMENT_TYPE_META[a.assignmentType]?.label}
                        </Text>
                        <Text style={s.meta} numberOfLines={1}>
                          Hạn {formatDateTime(a.deadline)}
                          {a.submittedAt ? ` · Nộp ${formatDateTime(a.submittedAt)}` : ''}
                        </Text>
                        <Pill label={badge.label} tone={badge.tone} />
                      </View>
                      {a.score != null ? <ScoreChip score={a.score} /> : <Text style={s.dash}>—</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </Section>

          {d ? (
            <View style={s.stats}>
              <StatTile
                label="Điểm TB quiz"
                value={d.totalQuizzesAttempted ? `${d.averageScorePercentage.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%` : '—'}
                color={MEN_LAM}
              />
              <StatTile label="Quiz đã làm" value={fmt(d.totalQuizzesAttempted)} color={MEN_LAM} />
              {quota ? (
                <>
                  <StatTile
                    label="Token còn dùng hôm nay"
                    value={fmt(quota.remaining)}
                    sub={`Hạn mức ${fmt(quota.quota)}/ngày · làm mới 00:00`}
                    color={ORANGE}
                  />
                  <StatTile
                    label="Token dùng hôm nay"
                    value={fmt(quota.used)}
                    sub={quota.bonus > 0 ? `Gồm ${fmt(quota.bonus)} token thầy cô duyệt thêm` : undefined}
                    color={AMBER}
                  />
                </>
              ) : null}
            </View>
          ) : null}

          <Section title="Quiz gần đây">
            {(d?.recentQuizzes ?? []).length === 0 ? (
              <View style={{ alignItems: 'flex-start', gap: 8 }}>
                <Text style={s.meta}>Chưa làm quiz nào.</Text>
                <Text style={s.link} onPress={() => router.push('/quiz')}>Làm quiz →</Text>
              </View>
            ) : (
              d!.recentQuizzes.map((q, i) => {
                const color = q.percentage >= 80 ? GREEN : q.percentage >= 50 ? AMBER : RED;
                return (
                  <TouchableOpacity
                    key={q.sessionId}
                    activeOpacity={0.7}
                    onPress={() => router.push({ pathname: '/quiz/result', params: { sessionId: q.sessionId } })}
                    style={[s.row, i > 0 && s.divider]}
                  >
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={s.rowTitle} numberOfLines={1}>{q.quizTitle}</Text>
                      <Text style={s.meta}>{formatDateTime(q.completedAt)}</Text>
                    </View>
                    <Text style={[s.pct, { color }]}>{Math.round(q.percentage)}%</Text>
                  </TouchableOpacity>
                );
              })
            )}
          </Section>

          <Section title="Bài tập sắp đến hạn">
            {upcoming.length === 0 ? (
              <Text style={s.meta}>Không có bài nào sắp đến hạn.</Text>
            ) : (
              upcoming.map((a, i) => (
                <TouchableOpacity
                  key={a.assignmentId}
                  activeOpacity={0.7}
                  onPress={() => router.push(`/assignments/${a.assignmentId}` as never)}
                  style={[s.row, i > 0 && s.divider]}
                >
                  <TypeTile type={a.assignmentType} size={34} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={s.rowTitle} numberOfLines={1}>{a.title}</Text>
                    <Text style={s.meta}>Hạn {formatDateTime(a.deadline)}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </Section>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  divider: { borderTopWidth: 1, borderTopColor: BORDER },
  rowTitle: { color: TEXT, fontSize: 14, fontWeight: '700' },
  meta: { color: MUTED, fontSize: 12 },
  dash: { color: MUTED, fontSize: 16, fontWeight: '800' },
  pct: { fontSize: 18, fontWeight: '900' },
  link: { color: ORANGE, fontSize: 13, fontWeight: '700' },
});
