import { Redirect, router, type Href } from 'expo-router';
import { ChevronRight, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ARCHIVE } from '@/components/archive';
import { EmptyState } from '@/components/empty-state';
import { HistoricalLeafletMap, type MapBattleMarker } from '@/components/map/historical-leaflet-map';
import { ListSkeleton, ScreenHeader } from '@/components/student/student-ui';
import { Text } from '@/components/ui/text';
import { CARD, MUTED, ORANGE, TEXT } from '@/constants/palette';
import { AppFonts } from '@/constants/theme';
import { useAuthStore } from '@/features/auth/store';
import { localMeta, localYears, materialHref, useStudentMaterials } from '@/features/local-contents/hooks';
import { MAP_BOUNDS } from '@/features/map/types';

const inBounds = (lat: number, lng: number) =>
  lat >= MAP_BOUNDS.south && lat <= MAP_BOUNDS.north && lng >= MAP_BOUNDS.west && lng <= MAP_BOUNDS.east;

/**
 * "Bản đồ lớp" (web: /map/class, mo tu Kho tu lieu): chi boi canh cua truong da xuat ban va co toa do.
 * Lop ghim rieng cua giao vien chua co API (giong web) nen chua hien.
 */
// Tu lieu cua truong chi danh cho hoc sinh; vai tro khac ve ban do chung.
export default function ClassMapRoute() {
  const isStudent = useAuthStore((s) => s.user?.role === 'SCHOOL_STUDENT');
  return isStudent ? <ClassMapScreen /> : <Redirect href="/map" />;
}

function ClassMapScreen() {
  const insets = useSafeAreaInsets();
  const { data = [], isLoading } = useStudentMaterials();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const placed = useMemo(
    () =>
      data.filter(
        (i) => i.type === 'CONTEXT' && i.latitude != null && i.longitude != null && inBounds(i.latitude, i.longitude),
      ),
    [data],
  );
  const markers = useMemo<MapBattleMarker[]>(
    () =>
      placed.map((i) => ({
        id: i.id,
        title: i.name,
        yearLabel: localYears(i) ?? '',
        imageUrl: i.imageUrl ?? undefined,
        lat: i.latitude!,
        lng: i.longitude!,
      })),
    [placed],
  );
  const selected = placed.find((i) => i.id === selectedId);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top']}>
      <ScreenHeader title="Bản đồ lớp" />

      {isLoading ? (
        <ListSkeleton count={2} />
      ) : markers.length === 0 ? (
        <EmptyState
          mood="thinking"
          title="Chưa có tư liệu nào trên bản đồ"
          description="Khi thầy cô ghim vị trí cho bối cảnh của lớp, chúng sẽ hiện ở đây."
          action={{ label: 'Mở kho tư liệu', onPress: () => router.replace('/classes/materials') }}
        />
      ) : (
        <View style={{ flex: 1 }}>
          <HistoricalLeafletMap
            battles={markers}
            notes={[]}
            selectedBattleId={selectedId}
            selectedNoteId={null}
            draft={null}
            placing={false}
            onSelectBattle={setSelectedId}
            onSelectNote={() => {}}
            onMapPress={() => setSelectedId(null)}
          />

          {selected ? (
            <View style={[s.sheet, { bottom: Math.max(insets.bottom, 12) }]}>
              <View style={s.sheetHead}>
                <Text style={s.kind}>BỐI CẢNH CỦA LỚP</Text>
                <TouchableOpacity onPress={() => setSelectedId(null)} hitSlop={10} accessibilityLabel="Đóng">
                  <X size={18} color={MUTED} />
                </TouchableOpacity>
              </View>
              <Text style={s.name} numberOfLines={2}>{selected.name}</Text>
              <Text style={s.meta} numberOfLines={1}>{localMeta(selected)}</Text>
              <TouchableOpacity
                style={s.cta}
                activeOpacity={0.85}
                onPress={() => router.push(materialHref(selected) as Href)}
              >
                <Text style={s.ctaText}>Đọc tư liệu</Text>
                <ChevronRight size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 12,
    right: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ARCHIVE.hairline,
    backgroundColor: CARD,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  kind: { color: '#1E8A6E', fontSize: 11, fontWeight: '700', letterSpacing: 1.1 },
  name: { marginTop: 6, color: TEXT, fontFamily: AppFonts.title, fontSize: 18, lineHeight: 23 },
  meta: { marginTop: 4, color: ARCHIVE.tertiary, fontSize: 13 },
  cta: {
    marginTop: 14,
    minHeight: 44,
    borderRadius: 8,
    backgroundColor: ORANGE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  ctaText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
