import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MaterialCard } from '@/components/student/material-card';
import {
  AssignmentRow,
  ChipTabs,
  EmptyState,
  JADE,
  ListSkeleton,
  Pill,
  ScoreChip,
  ScreenHeader,
  StatTile,
  TypeTile,
} from '@/components/student/student-ui';
import { Text } from '@/components/ui/text';
import { AMBER, BORDER, CARD, GREEN, MUTED, ORANGE, TEXT, TEXT2 } from '@/constants/palette';
import { useStudentAssignments } from '@/features/assignments/hooks';
import {
  assignmentBucket,
  averageScore,
  formatDateTime,
  isDone,
  isOpenBucket,
  sortByUrgency,
} from '@/features/assignments/meta';
import { useClassroom } from '@/features/classroom/hooks';
import { CLASSROOM_STATUS, classroomMeta } from '@/features/classroom/types';
import { isForClass, materialHref, useMaterialTasks, useStudentMaterials } from '@/features/local-contents/hooks';
import type { LocalKind } from '@/features/local-contents/types';
import { ApiError } from '@/lib/api-client';

type Tab = 'assignments' | 'materials' | 'grades';

/** Trang 1 lop cua hoc sinh — ban mobile cua web /classes/[classId] (StudentView). */
export default function ClassDetailScreen() {
  const router = useRouter();
  const { classId, tab: tabParam } = useLocalSearchParams<{ classId: string; tab?: Tab }>();
  const classroom = useClassroom(classId);
  const assignments = useStudentAssignments({ classroomId: classId, page: 0, size: 100 });
  const materials = useStudentMaterials();
  const tasks = useMaterialTasks();
  const [tab, setTab] = useState<Tab>(tabParam ?? 'assignments');
  const [kind, setKind] = useState<'ALL' | LocalKind>('ALL');

  const items = useMemo(() => assignments.data?.items ?? [], [assignments.data]);
  const classMaterials = useMemo(
    () => (materials.data ?? []).filter((m) => classId && isForClass(m, classId)),
    [materials.data, classId],
  );
  const todo = items.filter((a) => isOpenBucket(assignmentBucket(a)) && assignmentBucket(a) !== 'OVERDUE');
  // Cung con so voi tab "Bài tập (x cần làm)"; bai qua han tach rieng thay vi gop vao.
  const overdueCount = items.filter((a) => assignmentBucket(a) === 'OVERDUE').length;
  const done = items.filter((a) => isDone(a.submissionStatus));
  const avg = averageScore(done);

  if (classroom.isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top']}>
        <ScreenHeader title="Lớp học" />
        <ListSkeleton count={3} height={110} />
      </SafeAreaView>
    );
  }

  const c = classroom.data;
  if (!c) {
    const forbidden = classroom.error instanceof ApiError && [403, 404].includes(classroom.error.status);
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top']}>
        <ScreenHeader title="Lớp học" />
        <EmptyState
          title={forbidden ? 'Không xem được lớp này' : 'Không tải được lớp học'}
          description={forbidden ? 'Lớp không tồn tại hoặc bạn không thuộc lớp này.' : classroom.error?.message}
          action={forbidden
            ? { label: 'Về lớp học của bạn', onPress: () => router.replace('/classes' as never) }
            : { label: 'Thử lại', onPress: () => void classroom.refetch() }}
        />
      </SafeAreaView>
    );
  }

  const status = CLASSROOM_STATUS[c.status];
  const shownMaterials = classMaterials.filter((m) => kind === 'ALL' || m.type === kind);
  const graded = [...done].sort((a, b) => new Date(b.submittedAt ?? 0).getTime() - new Date(a.submittedAt ?? 0).getTime());

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top']}>
      <ScreenHeader title={`Lớp ${c.className}`} />
      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 48 }}
        refreshControl={
          <RefreshControl
            refreshing={classroom.isRefetching || assignments.isRefetching}
            onRefresh={() => {
              void classroom.refetch();
              void assignments.refetch();
              void materials.refetch();
            }}
            tintColor={ORANGE}
          />
        }
      >
        <View style={{ gap: 4 }}>
          <Text style={s.meta}>
            {classroomMeta(c)} · {c.studentCount} học sinh{c.teacher?.fullName ? ` · GV ${c.teacher.fullName}` : ''}
          </Text>
          {c.status !== 'ACTIVE' && status ? <Pill label={status.label} tone={status.tone} /> : null}
          {c.description ? <Text style={s.desc}>{c.description}</Text> : null}
        </View>

        <View style={s.stats}>
          <StatTile
            label="Bài cần làm"
            value={String(todo.length)}
            sub={overdueCount > 0 ? `+${overdueCount} quá hạn` : undefined}
            color={todo.length > 0 ? AMBER : GREEN}
            onPress={() => setTab('assignments')}
          />
          <StatTile label="Đã nộp" value={`${done.length}/${items.length}`} color={JADE} onPress={() => setTab('grades')} />
          <StatTile
            label="Điểm trung bình"
            value={avg == null ? '—' : avg.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}
            sub={avg == null ? undefined : '/ 10'}
            color={ORANGE}
            onPress={() => setTab('grades')}
          />
          <StatTile label="Tư liệu của lớp" value={String(classMaterials.length)} color={TEXT} onPress={() => setTab('materials')} />
        </View>

        <ChipTabs
          value={tab}
          onChange={setTab}
          options={[
            { value: 'assignments', label: `Bài tập (${todo.length} cần làm)` },
            { value: 'materials', label: `Tư liệu (${classMaterials.length})` },
            { value: 'grades', label: 'Điểm' },
          ]}
        />

        {tab === 'assignments' ? (
          assignments.isLoading ? (
            <Text style={s.meta}>Đang tải bài tập...</Text>
          ) : items.length === 0 ? (
            <EmptyState title="Lớp chưa có bài tập" description="Khi thầy cô giao bài, bài tập sẽ hiện ở đây." />
          ) : (
            <View style={{ gap: 10 }}>
              {sortByUrgency(items).map((a) => (
                <AssignmentRow
                  key={a.assignmentId}
                  assignment={a}
                  showClass={false}
                  onPress={() => router.push(`/assignments/${a.assignmentId}` as never)}
                />
              ))}
            </View>
          )
        ) : null}

        {tab === 'materials' ? (
          <View style={{ gap: 12 }}>
            <ChipTabs
              value={kind}
              onChange={setKind}
              options={[
                { value: 'ALL', label: `Tất cả (${classMaterials.length})` },
                { value: 'CONTEXT', label: `Bối cảnh (${classMaterials.filter((m) => m.type === 'CONTEXT').length})` },
                { value: 'CHARACTER', label: `Nhân vật (${classMaterials.filter((m) => m.type === 'CHARACTER').length})` },
              ]}
            />
            {shownMaterials.length === 0 ? (
              <EmptyState
                title="Lớp chưa có tư liệu"
                action={{ label: 'Khám phá thư viện HistoryTalk', onPress: () => router.push('/context' as never) }}
              />
            ) : (
              shownMaterials.map((m) => (
                <MaterialCard key={`${m.type}-${m.id}`} item={m} task={tasks.get(m.id)} onPress={() => router.push(materialHref(m) as never)} />
              ))
            )}
          </View>
        ) : null}

        {tab === 'grades' ? (
          <View style={s.panel}>
            <Text style={s.panelTitle}>
              Điểm trung bình của bạn ở lớp này: {avg == null ? '—' : `${avg.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} / 10`}
            </Text>
            {graded.length === 0 ? (
              <Text style={s.meta}>Chưa có điểm. Nộp bài để được chấm điểm tự động.</Text>
            ) : (
              graded.map((a, i) => (
                <View key={a.assignmentId} style={[s.gradeRow, i > 0 && s.divider]}>
                  <TypeTile type={a.assignmentType} size={34} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={s.rowTitle} numberOfLines={1} onPress={() => router.push(`/assignments/${a.assignmentId}` as never)}>
                      {a.title}
                    </Text>
                    <Text style={s.meta}>Nộp lúc {formatDateTime(a.submittedAt)}</Text>
                  </View>
                  {a.score != null ? <ScoreChip score={a.score} /> : <Text style={s.meta}>Chưa có điểm</Text>}
                </View>
              ))
            )}
            <Text style={s.link} onPress={() => router.push('/grades' as never)}>Xem bảng điểm tất cả các lớp →</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  meta: { color: MUTED, fontSize: 13, lineHeight: 18 },
  desc: { color: TEXT2, fontSize: 14, lineHeight: 21, marginTop: 6 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  panel: { backgroundColor: CARD, borderRadius: 12, borderWidth: 1, borderColor: BORDER, padding: 16, gap: 10 },
  panelTitle: { color: TEXT, fontSize: 14, fontWeight: '800' },
  gradeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 10 },
  divider: { borderTopWidth: 1, borderTopColor: BORDER },
  rowTitle: { color: TEXT, fontSize: 14, fontWeight: '700' },
  link: { color: ORANGE, fontSize: 13, fontWeight: '700', marginTop: 4 },
});
