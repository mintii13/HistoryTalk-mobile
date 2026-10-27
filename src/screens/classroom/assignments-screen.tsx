import { useRouter } from 'expo-router';
import { ClipboardCheck } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AssignmentRow,
  ChipTabs,
  EmptyState,
  GOLD,
  JADE,
  ListSkeleton,
  MEN_LAM,
  ScreenHeader,
} from '@/components/student/student-ui';
import { Text } from '@/components/ui/text';
import { AMBER, MUTED, ORANGE, RED } from '@/constants/palette';
import { useStudentAssignments } from '@/features/assignments/hooks';
import { assignmentBucket, sortByDeadline, type AssignmentBucket } from '@/features/assignments/meta';

type Tab = 'TODO' | 'DUE_SOON' | 'DONE' | 'OVERDUE' | 'EXEMPTED';

const TABS: { value: Tab; label: string; color: string; empty: string }[] = [
  { value: 'TODO', label: 'Cần làm', color: ORANGE, empty: 'Bạn đã làm hết bài được giao. Tuyệt vời!' },
  { value: 'DUE_SOON', label: 'Sắp hết hạn', color: AMBER, empty: 'Không có bài nào hết hạn trong 48 giờ tới.' },
  { value: 'DONE', label: 'Đã nộp', color: JADE, empty: 'Chưa có bài nào được nộp.' },
  { value: 'OVERDUE', label: 'Quá hạn', color: RED, empty: 'Không có bài nào quá hạn.' },
  { value: 'EXEMPTED', label: 'Được miễn', color: MEN_LAM, empty: 'Bạn không được miễn bài nào.' },
];

/** "Cần làm" gom ca bai sap het han, giong web. */
function inTab(bucket: AssignmentBucket, tab: Tab) {
  return tab === 'TODO' ? bucket === 'TODO' || bucket === 'DUE_SOON' : bucket === tab;
}

/** Danh sach bai tap cua hoc sinh — ban mobile cua web /assignments. */
export default function AssignmentsScreen() {
  const router = useRouter();
  const { data, isLoading, isError, error, refetch, isRefetching } = useStudentAssignments({ page: 0, size: 100 });
  const [tab, setTab] = useState<Tab>('TODO');

  const items = useMemo(() => data?.items ?? [], [data]);
  const counts = useMemo(() => {
    const c: Record<Tab, number> = { TODO: 0, DUE_SOON: 0, DONE: 0, OVERDUE: 0, EXEMPTED: 0 };
    for (const a of items) {
      const b = assignmentBucket(a);
      for (const t of TABS) if (inTab(b, t.value)) c[t.value] += 1;
    }
    return c;
  }, [items]);
  const visible = useMemo(() => {
    const filtered = items.filter((a) => inTab(assignmentBucket(a), tab));
    return sortByDeadline(filtered, tab === 'TODO' || tab === 'DUE_SOON' ? 'asc' : 'desc');
  }, [items, tab]);
  const current = TABS.find((t) => t.value === tab)!;
  const total = data?.totalElements ?? items.length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top']}>
      <ScreenHeader title="Bài tập" back={false} />
      {isLoading ? (
        <ListSkeleton count={4} />
      ) : isError ? (
        <EmptyState title="Không tải được bài tập" description={error?.message} action={{ label: 'Thử lại', onPress: () => void refetch() }} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="Chưa có bài tập nào"
          description="Khi thầy cô giao bài, bài tập sẽ hiện ở đây."
          action={{ label: 'Lớp học của bạn', onPress: () => router.push('/classes' as never) }}
        />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(a) => a.assignmentId}
          contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: 40 }}
          refreshing={isRefetching}
          onRefresh={() => void refetch()}
          ListHeaderComponent={
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 4 }}>
              <ChipTabs
                value={tab}
                onChange={setTab}
                options={TABS.map((t) => ({ value: t.value, label: `${t.label} (${counts[t.value]})`, color: t.color }))}
              />
            </ScrollView>
          }
          renderItem={({ item }) => (
            <AssignmentRow assignment={item} onPress={() => router.push(`/assignments/${item.assignmentId}` as never)} />
          )}
          ListEmptyComponent={<Text style={s.empty}>{current.empty}</Text>}
          ListFooterComponent={
            <View style={{ gap: 8, alignItems: 'center', marginTop: 4 }}>
              {total > items.length ? <Text style={s.footer}>Đang hiện {items.length}/{total} bài gần nhất.</Text> : null}
              <Text style={[s.footer, { color: GOLD }]} onPress={() => router.push('/grades' as never)}>Xem bảng điểm →</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  empty: { color: MUTED, fontSize: 14, textAlign: 'center', marginTop: 32, paddingHorizontal: 24 },
  footer: { color: MUTED, fontSize: 13, fontWeight: '600', paddingVertical: 6 },
});
