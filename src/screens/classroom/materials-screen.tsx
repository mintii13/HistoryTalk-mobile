import { useRouter } from 'expo-router';
import { LibraryBig, Map as MapIcon, Search, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HeaderIconButton } from '@/components/screen-header';
import { MaterialCard } from '@/components/student/material-card';
import { ChipTabs, EmptyState, GOLD, ListSkeleton, ScreenHeader } from '@/components/student/student-ui';
import { Text } from '@/components/ui/text';
import { TextInput } from '@/components/ui/text-input';
import { BORDER, CARD, MUTED, TEXT } from '@/constants/palette';
import { materialHref, useMaterialTasks, useStudentMaterials } from '@/features/local-contents/hooks';
import type { LocalKind } from '@/features/local-contents/types';
import { normalizeText } from '@/lib/normalize-text';

type Filter = 'ALL' | LocalKind;

/** Kho tu lieu thay co soan — ban mobile cua web /classes/materials. */
export default function MaterialsScreen() {
  const router = useRouter();
  const { data, isLoading, isError, error, refetch, isRefetching } = useStudentMaterials();
  const tasks = useMaterialTasks();
  const [filter, setFilter] = useState<Filter>('ALL');
  const [query, setQuery] = useState('');

  const items = useMemo(() => data ?? [], [data]);
  const counts = {
    ALL: items.length,
    CONTEXT: items.filter((i) => i.type === 'CONTEXT').length,
    CHARACTER: items.filter((i) => i.type === 'CHARACTER').length,
  };
  const visible = useMemo(() => {
    const q = normalizeText(query);
    const pending = (id: string) => (tasks.get(id) && !tasks.get(id)!.done ? 0 : 1);
    return items
      .filter((i) => filter === 'ALL' || i.type === filter)
      .filter((i) => !q || normalizeText(i.name).includes(q))
      .sort((a, b) => pending(a.id) - pending(b.id) || new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [items, filter, query, tasks]);
  const pendingCount = items.filter((i) => tasks.get(i.id) && !tasks.get(i.id)!.done).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top']}>
      <ScreenHeader
        title="Kho tư liệu"
        back={false}
        right={
          <HeaderIconButton label="Bản đồ lớp" onPress={() => router.push('/map/class')}>
            <MapIcon size={19} color={TEXT} strokeWidth={2} />
          </HeaderIconButton>
        }
      />
      {isLoading ? (
        <ListSkeleton count={4} height={120} />
      ) : isError ? (
        <EmptyState title="Không tải được tư liệu" description={error?.message} action={{ label: 'Thử lại', onPress: () => void refetch() }} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={LibraryBig}
          title="Kho tư liệu đang trống"
          description="Thầy cô chưa đăng tư liệu nào. Trong lúc chờ, bạn có thể khám phá thư viện HistoryTalk."
          action={{ label: 'Khám phá sự kiện', onPress: () => router.push('/context' as never) }}
        />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(i) => `${i.type}-${i.id}`}
          contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: 40 }}
          refreshing={isRefetching}
          onRefresh={() => void refetch()}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View style={{ gap: 12 }}>
              <Text style={s.desc}>Bài đọc và nhân vật lịch sử thầy cô chuẩn bị cho bạn.</Text>
              <View style={s.searchBox}>
                <Search size={18} color={MUTED} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Tìm theo tên..."
                  placeholderTextColor={MUTED}
                  style={s.searchInput}
                  returnKeyType="search"
                />
                {query ? (
                  <TouchableOpacity onPress={() => setQuery('')} hitSlop={10} accessibilityLabel="Xoá tìm kiếm">
                    <X size={18} color={MUTED} />
                  </TouchableOpacity>
                ) : null}
              </View>
              <ChipTabs
                value={filter}
                onChange={setFilter}
                options={[
                  { value: 'ALL', label: `Tất cả (${counts.ALL})` },
                  { value: 'CONTEXT', label: `Bối cảnh (${counts.CONTEXT})` },
                  { value: 'CHARACTER', label: `Nhân vật (${counts.CHARACTER})` },
                ]}
              />
              {pendingCount > 0 && filter === 'ALL' && !query ? (
                <View style={s.banner}>
                  <Text style={s.bannerText}>
                    Bạn có <Text style={{ fontWeight: '900', color: GOLD }}>{pendingCount}</Text> tư liệu cần đọc hoặc trò chuyện để nộp bài. Chúng được xếp lên đầu.
                  </Text>
                </View>
              ) : null}
            </View>
          }
          renderItem={({ item }) => (
            <MaterialCard item={item} task={tasks.get(item.id)} onPress={() => router.push(materialHref(item) as never)} />
          )}
          ListEmptyComponent={
            <EmptyState
              title="Không tìm thấy tư liệu"
              action={{ label: 'Xoá bộ lọc', onPress: () => { setFilter('ALL'); setQuery(''); } }}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  desc: { color: MUTED, fontSize: 13 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 46,
    backgroundColor: CARD, borderRadius: 10, borderWidth: 1, borderColor: BORDER, paddingHorizontal: 14,
  },
  searchInput: { flex: 1, color: TEXT, fontSize: 15, paddingVertical: 10 },
  banner: { borderRadius: 10, borderWidth: 1, borderColor: `${GOLD}55`, backgroundColor: `${GOLD}12`, padding: 12 },
  bannerText: { color: TEXT, fontSize: 13, lineHeight: 19 },
});
